import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { randomBytes, createHash } from 'crypto';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { Model, Types } from 'mongoose';
import { google, youtube_v3 } from 'googleapis';
import { PublishYoutubeDto } from './dto/publish-youtube.dto';
import { PublishYoutubeUploadDto } from './dto/publish-youtube-upload.dto';
import { YoutubeAccount, YoutubeAccountDocument } from './schemas/youtube-account.schema';
import {
  YoutubeOauthSession,
  YoutubeOauthSessionDocument,
} from './schemas/youtube-oauth-session.schema';

@Injectable()
export class YoutubeAuthService {
  constructor(
    @InjectModel(YoutubeAccount.name)
    private readonly youtubeAccountModel: Model<YoutubeAccountDocument>,
    @InjectModel(YoutubeOauthSession.name)
    private readonly youtubeOauthSessionModel: Model<YoutubeOauthSessionDocument>,
    private readonly configService: ConfigService,
  ) {}
  async createOauthStart(
    userId: string,
    appRedirectUri?: string,
  ): Promise<{ authUrl: string; state: string; expiresAt: string }> {
    this.ensureYoutubeConfig();
    const state = randomBytes(24).toString('hex');
    const codeVerifier = this.toBase64Url(randomBytes(64));
    const codeChallenge = this.toBase64Url(
      createHash('sha256').update(codeVerifier).digest(),
    );
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.youtubeOauthSessionModel.create({
      userId: new Types.ObjectId(userId),
      state,
      codeVerifier,
      appRedirectUri,
      expiresAt,
      used: false,
    });
    const oauthClient = this.createOAuthClient();
    const authUrl = oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
      ],
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256' as any,
    });
    return { authUrl, state, expiresAt: expiresAt.toISOString() };
  }
  async handleOauthCallback(
    code: string,
    state: string,
  ): Promise<{ success: true; redirectUrl?: string }> {
    if (!code || !state) {
      throw new BadRequestException('Missing OAuth code or state');
    }
    const session = await this.youtubeOauthSessionModel.findOne({ state }).exec();
    if (!session || session.used || session.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OAuth session');
    }
    const oauthClient = this.createOAuthClient();
    const tokenResult = await oauthClient.getToken({
      code,
      codeVerifier: session.codeVerifier,
    });
    const tokens = tokenResult.tokens;
    if (!tokens.access_token) {
      throw new InternalServerErrorException('No access token returned by Google');
    }
    oauthClient.setCredentials(tokens);
    const channelInfo = await this.fetchCurrentChannel(oauthClient);
    await this.youtubeAccountModel.findOneAndUpdate(
      { userId: session.userId },
      {
        $set: {
          userId: session.userId,
          platform: 'youtube',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: (tokens.scope ?? '').split(' ').filter(Boolean),
          expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          channelId: channelInfo?.id,
          channelTitle: channelInfo?.snippet?.title,
          channelThumbnail:
            channelInfo?.snippet?.thumbnails?.default?.url ??
            channelInfo?.snippet?.thumbnails?.medium?.url,
        },
      },
      { upsert: true, new: true },
    );
    session.used = true;
    await session.save();
    const redirectUrl = this.buildCallbackRedirectUrl(session.appRedirectUri);
    return { success: true, redirectUrl };
  }
  async getCurrentConnection(userId: string): Promise<{
    connected: boolean;
    channelId?: string;
    channelTitle?: string;
    channelThumbnail?: string;
    expiryDate?: Date;
  }> {
    const account = await this.youtubeAccountModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();
    if (!account) {
      return { connected: false };
    }
    return {
      connected: true,
      channelId: account.channelId,
      channelTitle: account.channelTitle,
      channelThumbnail: account.channelThumbnail,
      expiryDate: account.expiryDate,
    };
  }
  async disconnect(userId: string): Promise<void> {
    await this.youtubeAccountModel
      .findOneAndDelete({ userId: new Types.ObjectId(userId) })
      .exec();
  }
  async publishFromUrl(
    userId: string,
    body: PublishYoutubeDto,
  ): Promise<{ success: true; videoId: string; youtubeUrl: string }> {
    const account = await this.youtubeAccountModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!account) {
      throw new NotFoundException('No connected YouTube account found');
    }
    const oauthClient = this.createOAuthClient();
    oauthClient.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.expiryDate?.getTime(),
    });
    const refreshed = await oauthClient.getAccessToken();
    if (refreshed.token && refreshed.token !== account.accessToken) {
      account.accessToken = refreshed.token;
      await account.save();
    }

    const mediaResponse = await axios.get(body.videoUrl, {
      responseType: 'stream',
      timeout: 120000,
      maxRedirects: 5,
    });

    const youtube = google.youtube({ version: 'v3' as const, auth: oauthClient as any });
    const inserted = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: body.title,
          description: body.description ?? '',
          tags: body.tags ?? [],
        },
        status: {
          privacyStatus: body.privacyStatus ?? 'private',
        },
      },
      media: {
        body: mediaResponse.data,
      },
    });

    const videoId = inserted.data.id;
    if (!videoId) {
      throw new InternalServerErrorException('YouTube did not return a video id');
    }

    if (oauthClient.credentials.access_token) {
      account.accessToken = oauthClient.credentials.access_token;
    }
    if (oauthClient.credentials.refresh_token) {
      account.refreshToken = oauthClient.credentials.refresh_token;
    }
    if (oauthClient.credentials.expiry_date) {
      account.expiryDate = new Date(oauthClient.credentials.expiry_date);
    }
    await account.save();

    return {
      success: true,
      videoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }
  async publishFromUploadedFile(
    userId: string,
    body: PublishYoutubeUploadDto,
    file: Express.Multer.File,
  ): Promise<{ success: true; videoId: string; youtubeUrl: string }> {
    const account = await this.youtubeAccountModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!account) {
      throw new NotFoundException('No connected YouTube account found');
    }
    if (!file?.path) {
      throw new BadRequestException('Uploaded video file is missing');
    }

    const oauthClient = this.createOAuthClient();
    oauthClient.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
      expiry_date: account.expiryDate?.getTime(),
    });

    const refreshed = await oauthClient.getAccessToken();
    if (refreshed.token && refreshed.token !== account.accessToken) {
      account.accessToken = refreshed.token;
      await account.save();
    }

    try {
      const youtube = google.youtube({ version: 'v3' as const, auth: oauthClient as any });
      const inserted = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: body.title,
            description: body.description ?? '',
            tags: this.parseTags(body.tagsCsv),
          },
          status: {
            privacyStatus: body.privacyStatus ?? 'private',
          },
        },
        media: {
          body: createReadStream(file.path),
        },
      });

      const videoId = inserted.data.id;
      if (!videoId) {
        throw new InternalServerErrorException('YouTube did not return a video id');
      }

      if (oauthClient.credentials.access_token) {
        account.accessToken = oauthClient.credentials.access_token;
      }
      if (oauthClient.credentials.refresh_token) {
        account.refreshToken = oauthClient.credentials.refresh_token;
      }
      if (oauthClient.credentials.expiry_date) {
        account.expiryDate = new Date(oauthClient.credentials.expiry_date);
      }
      await account.save();

      return {
        success: true,
        videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  }
  private createOAuthClient() {
    const clientId = this.configService.get<string>('YOUTUBE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('YOUTUBE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('YOUTUBE_REDIRECT_URI');

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }
  private ensureYoutubeConfig(): void {
    const requiredKeys = [
      'YOUTUBE_CLIENT_ID',
      'YOUTUBE_CLIENT_SECRET',
      'YOUTUBE_REDIRECT_URI',
    ];
    for (const key of requiredKeys) {
      if (!this.configService.get<string>(key)) {
        throw new InternalServerErrorException(
          `Missing required env var: ${key}`,
        );
      }
    }
  }
  private buildCallbackRedirectUrl(appRedirectUri?: string): string | undefined {
    if (!appRedirectUri) return undefined;
    const separator = appRedirectUri.includes('?') ? '&' : '?';
    return `${appRedirectUri}${separator}platform=youtube&status=connected`;
  }
  private async fetchCurrentChannel(
    oauthClient: any,
  ): Promise<youtube_v3.Schema$Channel | undefined> {
    const youtube = google.youtube({ version: 'v3' as const, auth: oauthClient as any });
    const response = await youtube.channels.list({
      part: ['id', 'snippet'],
      mine: true,
      maxResults: 1,
    });

    return response.data.items?.[0];
  }
  private toBase64Url(input: Buffer): string {
    return input
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
  private parseTags(tagsCsv?: string): string[] {
    if (!tagsCsv) return [];
    return tagsCsv
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 30);
  }
}

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
import { readFile, unlink } from 'fs/promises';
import { Model, Types } from 'mongoose';
import { PublishInstagramDto } from './dto/publish-instagram.dto';
import { PublishInstagramUploadDto } from './dto/publish-instagram-upload.dto';
import {
  InstagramAccount,
  InstagramAccountDocument,
} from './schemas/instagram-account.schema';
import {
  InstagramOauthSession,
  InstagramOauthSessionDocument,
} from './schemas/instagram-oauth-session.schema';

type MeAccountsResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: {
      id?: string;
      username?: string;
      profile_picture_url?: string;
    };
  }>;
};

type CreateMediaResponse = {
  id?: string;
};

type PublishMediaResponse = {
  id?: string;
};

type PublishInstagramPayload = {
  mediaType: 'image' | 'video' | 'reel';
  mediaUrl: string;
  caption?: string;
  shareToFeed?: boolean;
};

@Injectable()
export class InstagramAuthService {
  private readonly graphBase = 'https://graph.facebook.com/v20.0';
  private readonly oauthBase = 'https://www.facebook.com/v20.0/dialog/oauth';

  constructor(
    @InjectModel(InstagramAccount.name)
    private readonly instagramAccountModel: Model<InstagramAccountDocument>,
    @InjectModel(InstagramOauthSession.name)
    private readonly instagramOauthSessionModel: Model<InstagramOauthSessionDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createOauthStart(
    userId: string,
    appRedirectUri?: string,
  ): Promise<{ authUrl: string; state: string; expiresAt: string }> {
    this.ensureInstagramConfig();
    const state = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.instagramOauthSessionModel.create({
      userId: new Types.ObjectId(userId),
      state,
      appRedirectUri,
      expiresAt,
      used: false,
    });

    const clientId = this.getInstagramAppId();
    const redirectUri = this.getInstagramRedirectUri();
    const scope = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'business_management',
    ].join(',');

    const authUrl = `${this.oauthBase}?client_id=${encodeURIComponent(clientId || '')}&redirect_uri=${encodeURIComponent(redirectUri || '')}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;

    return { authUrl, state, expiresAt: expiresAt.toISOString() };
  }

  async handleOauthCallback(
    code: string,
    state: string,
  ): Promise<{ success: true; redirectUrl?: string }> {
    if (!code || !state) {
      throw new BadRequestException('Missing OAuth code or state');
    }

    const session = await this.instagramOauthSessionModel.findOne({ state }).exec();
    if (!session || session.used || session.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OAuth session');
    }

    const token = await this.exchangeCodeForToken(code);
    const accountInfo = await this.resolveInstagramBusinessAccount(token.access_token);

    await this.instagramAccountModel.findOneAndUpdate(
      { userId: session.userId },
      {
        $set: {
          userId: session.userId,
          platform: 'instagram',
          accessToken: token.access_token,
          scope: (token.scope ?? '').split(',').map((x) => x.trim()).filter(Boolean),
          expiryDate: token.expires_in
            ? new Date(Date.now() + token.expires_in * 1000)
            : undefined,
          igUserId: accountInfo.igUserId,
          username: accountInfo.username,
          profilePictureUrl: accountInfo.profilePictureUrl,
          pageId: accountInfo.pageId,
          pageName: accountInfo.pageName,
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
    igUserId?: string;
    username?: string;
    profilePictureUrl?: string;
    pageName?: string;
    expiryDate?: Date;
  }> {
    const account = await this.instagramAccountModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();

    if (!account) {
      return { connected: false };
    }

    return {
      connected: true,
      igUserId: account.igUserId,
      username: account.username,
      profilePictureUrl: account.profilePictureUrl,
      pageName: account.pageName,
      expiryDate: account.expiryDate,
    };
  }

  async disconnect(userId: string): Promise<void> {
    await this.instagramAccountModel
      .findOneAndDelete({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async publishFromUrl(
    userId: string,
    body: PublishInstagramDto,
  ): Promise<{ success: true; mediaId: string; permalink?: string }> {
    const account = await this.instagramAccountModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!account) {
      throw new NotFoundException('No connected Instagram account found');
    }

    if (!account.igUserId) {
      throw new BadRequestException('Instagram business account id is missing');
    }

    const creationId = await this.createMediaContainer(account.igUserId, account.accessToken, body);
    await this.waitUntilContainerReady(creationId, account.accessToken);

    const publishedMediaId = await this.publishMediaContainer(
      account.igUserId,
      account.accessToken,
      creationId,
    );

    const permalink = await this.fetchPermalink(publishedMediaId, account.accessToken);

    return {
      success: true,
      mediaId: publishedMediaId,
      permalink,
    };
  }

  async publishFromUploadedFile(
    userId: string,
    body: PublishInstagramUploadDto,
    file: Express.Multer.File,
  ): Promise<{ success: true; mediaId: string; permalink?: string; mediaUrl?: string }> {
    const account = await this.instagramAccountModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!account) {
      throw new NotFoundException('No connected Instagram account found');
    }

    if (!account.igUserId) {
      throw new BadRequestException('Instagram business account id is missing');
    }

    if (!file?.path) {
      throw new BadRequestException('Uploaded media file is missing');
    }

    this.ensureCloudinaryConfig();

    try {
      const mediaUrl = await this.uploadFileToCloudinary(file.path, body.mediaType, userId);
      const payload: PublishInstagramPayload = {
        mediaType: body.mediaType,
        mediaUrl,
        caption: body.caption,
        shareToFeed: body.shareToFeed,
      };

      const creationId = await this.createMediaContainer(account.igUserId, account.accessToken, payload);
      await this.waitUntilContainerReady(creationId, account.accessToken);

      const publishedMediaId = await this.publishMediaContainer(
        account.igUserId,
        account.accessToken,
        creationId,
      );

      const permalink = await this.fetchPermalink(publishedMediaId, account.accessToken);

      return {
        success: true,
        mediaId: publishedMediaId,
        permalink,
        mediaUrl,
      };
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  }

  private async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    token_type?: string;
    expires_in?: number;
    scope?: string;
  }> {
    const clientId = this.getInstagramAppId();
    const clientSecret = this.getInstagramAppSecret();
    const redirectUri = this.getInstagramRedirectUri();

    const response = await axios.get(`${this.graphBase}/oauth/access_token`, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      },
      timeout: 30000,
    });

    if (!response.data?.access_token) {
      throw new InternalServerErrorException('Meta did not return an access token');
    }

    return response.data;
  }

  private async resolveInstagramBusinessAccount(accessToken: string): Promise<{
    igUserId: string;
    username?: string;
    profilePictureUrl?: string;
    pageId?: string;
    pageName?: string;
  }> {
    const response = await axios.get<MeAccountsResponse>(`${this.graphBase}/me/accounts`, {
      params: {
        fields: 'id,name,instagram_business_account{id,username,profile_picture_url}',
        access_token: accessToken,
      },
      timeout: 30000,
    });

    const pageWithInstagram = (response.data?.data ?? []).find(
      (page) => page.instagram_business_account?.id,
    );

    if (!pageWithInstagram?.instagram_business_account?.id) {
      throw new BadRequestException(
        'No Instagram Business/Creator account linked to your Facebook Page',
      );
    }

    return {
      igUserId: pageWithInstagram.instagram_business_account.id,
      username: pageWithInstagram.instagram_business_account.username,
      profilePictureUrl: pageWithInstagram.instagram_business_account.profile_picture_url,
      pageId: pageWithInstagram.id,
      pageName: pageWithInstagram.name,
    };
  }

  private async createMediaContainer(
    igUserId: string,
    accessToken: string,
    body: PublishInstagramPayload,
  ): Promise<string> {
    const endpoint = `${this.graphBase}/${igUserId}/media`;
    const payload: Record<string, string | boolean> = {
      caption: body.caption ?? '',
      access_token: accessToken,
    };

    if (body.mediaType === 'image') {
      payload.image_url = body.mediaUrl;
    } else if (body.mediaType === 'video') {
      payload.media_type = 'VIDEO';
      payload.video_url = body.mediaUrl;
    } else {
      payload.media_type = 'REELS';
      payload.video_url = body.mediaUrl;
      payload.share_to_feed = body.shareToFeed ?? true;
    }

    const response = await axios.post<CreateMediaResponse>(endpoint, null, {
      params: payload,
      timeout: 60000,
    });

    if (!response.data?.id) {
      throw new InternalServerErrorException('Failed to create Instagram media container');
    }

    return response.data.id;
  }

  private async waitUntilContainerReady(
    creationId: string,
    accessToken: string,
  ): Promise<void> {
    const maxAttempts = 18;
    const delayMs = 5000;
    let transientNetworkErrors = 0;

    for (let i = 0; i < maxAttempts; i += 1) {
      let response: { data?: { status_code?: 'IN_PROGRESS' | 'FINISHED' | 'ERROR' | 'EXPIRED' } };
      try {
        response = await axios.get<{
          status_code?: 'IN_PROGRESS' | 'FINISHED' | 'ERROR' | 'EXPIRED';
        }>(`${this.graphBase}/${creationId}`, {
          params: {
            fields: 'status_code',
            access_token: accessToken,
          },
          timeout: 30000,
        });
      } catch (error: any) {
        if (this.isTransientNetworkError(error)) {
          transientNetworkErrors += 1;
          // Retry on temporary network issues when polling Meta processing status.
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw error;
      }

      const status = response.data?.status_code;
      if (!status || status === 'FINISHED') {
        return;
      }
      if (status === 'ERROR' || status === 'EXPIRED') {
        throw new BadRequestException(`Instagram media processing failed with status: ${status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (transientNetworkErrors > 0) {
      throw new BadRequestException(
        'Instagram processing check failed due to temporary network timeouts. Please retry.',
      );
    }
    throw new BadRequestException('Instagram media processing timed out');
  }

  private isTransientNetworkError(error: unknown): boolean {
    const code = (error as { code?: string; cause?: { code?: string } })?.code
      ?? (error as { cause?: { code?: string } })?.cause?.code;
    return code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ENETUNREACH';
  }

  private async publishMediaContainer(
    igUserId: string,
    accessToken: string,
    creationId: string,
  ): Promise<string> {
    const response = await axios.post<PublishMediaResponse>(
      `${this.graphBase}/${igUserId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: accessToken,
        },
        timeout: 60000,
      },
    );

    if (!response.data?.id) {
      throw new InternalServerErrorException('Failed to publish Instagram media');
    }

    return response.data.id;
  }

  private async fetchPermalink(mediaId: string, accessToken: string): Promise<string | undefined> {
    const response = await axios.get<{ permalink?: string }>(`${this.graphBase}/${mediaId}`, {
      params: {
        fields: 'permalink',
        access_token: accessToken,
      },
      timeout: 30000,
    });

    return response.data?.permalink;
  }

  private ensureInstagramConfig(): void {
    if (!this.getInstagramAppId()) {
      throw new InternalServerErrorException(
        'Missing required env var: INSTAGRAM_APP_ID (or INSTAGRAMAPPID)',
      );
    }
    if (!this.getInstagramAppSecret()) {
      throw new InternalServerErrorException(
        'Missing required env var: INSTAGRAM_APP_SECRET (or INSTAGRAMAPPSECRET)',
      );
    }
    if (!this.getInstagramRedirectUri()) {
      throw new InternalServerErrorException(
        'Missing required env var: INSTAGRAM_REDIRECT_URI (or INSTAGRAMREDIRECTURI)',
      );
    }
  }

  private ensureCloudinaryConfig(): void {
    if (!this.getCloudinaryCloudName()) {
      throw new InternalServerErrorException('Missing required env var: CLOUDINARY_CLOUD_NAME');
    }
    if (!this.getCloudinaryApiKey()) {
      throw new InternalServerErrorException('Missing required env var: CLOUDINARY_API_KEY');
    }
    if (!this.getCloudinaryApiSecret()) {
      throw new InternalServerErrorException('Missing required env var: CLOUDINARY_API_SECRET');
    }
  }

  private getInstagramAppId(): string | undefined {
    return this.configService.get<string>('INSTAGRAM_APP_ID')
      ?? this.configService.get<string>('INSTAGRAMAPPID');
  }

  private getInstagramAppSecret(): string | undefined {
    return this.configService.get<string>('INSTAGRAM_APP_SECRET')
      ?? this.configService.get<string>('INSTAGRAMAPPSECRET');
  }

  private getInstagramRedirectUri(): string | undefined {
    return this.configService.get<string>('INSTAGRAM_REDIRECT_URI')
      ?? this.configService.get<string>('INSTAGRAMREDIRECTURI');
  }

  private getCloudinaryCloudName(): string | undefined {
    return this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
  }

  private getCloudinaryApiKey(): string | undefined {
    return this.configService.get<string>('CLOUDINARY_API_KEY');
  }

  private getCloudinaryApiSecret(): string | undefined {
    return this.configService.get<string>('CLOUDINARY_API_SECRET');
  }

  private async uploadFileToCloudinary(
    filePath: string,
    mediaType: 'image' | 'video' | 'reel',
    userId: string,
  ): Promise<string> {
    const cloudName = this.getCloudinaryCloudName() as string;
    const apiKey = this.getCloudinaryApiKey() as string;
    const apiSecret = this.getCloudinaryApiSecret() as string;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = `ideaspark/instagram/${userId}`;
    const publicId = `ig-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const resourceType = mediaType === 'image' ? 'image' : 'video';

    const signature = this.signCloudinaryParams(
      { folder, public_id: publicId, timestamp },
      apiSecret,
    );

    const fileBuffer = await readFile(filePath);
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), `${publicId}`);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);
    formData.append('public_id', publicId);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    const data = (await response.json()) as any;
    if (!response.ok || !data?.secure_url) {
      const cloudinaryError = data?.error?.message || 'Unknown Cloudinary upload error';
      throw new InternalServerErrorException(`Cloudinary upload failed: ${cloudinaryError}`);
    }

    return data.secure_url;
  }

  private signCloudinaryParams(
    params: Record<string, string | number | undefined>,
    apiSecret: string,
  ): string {
    const toSign = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex');
  }

  private buildCallbackRedirectUrl(appRedirectUri?: string): string | undefined {
    if (!appRedirectUri) return undefined;
    const separator = appRedirectUri.includes('?') ? '&' : '?';
    return `${appRedirectUri}${separator}platform=instagram&status=connected`;
  }
}


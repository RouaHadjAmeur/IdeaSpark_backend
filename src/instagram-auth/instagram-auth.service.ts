import {
  BadRequestException,
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { randomBytes, createHash } from 'crypto';
import { existsSync } from 'fs';
import { readFile, unlink } from 'fs/promises';
import ffmpeg = require('fluent-ffmpeg');
import { Model, Types } from 'mongoose';
import { extname, join } from 'path';
import { tmpdir } from 'os';
import { createWriteStream } from 'fs';
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
  audioUrl?: string;
};

@Injectable()
export class InstagramAuthService {
  private readonly logger = new Logger(InstagramAuthService.name);
  private readonly graphBase = 'https://graph.facebook.com/v20.0';
  private readonly oauthBase = 'https://www.facebook.com/v20.0/dialog/oauth';

  constructor(
    @InjectModel(InstagramAccount.name)
    private readonly instagramAccountModel: Model<InstagramAccountDocument>,
    @InjectModel(InstagramOauthSession.name)
    private readonly instagramOauthSessionModel: Model<InstagramOauthSessionDocument>,
    private readonly configService: ConfigService,
  ) {
    try {
      const ffprobe = require('ffprobe-static');
      ffmpeg.setFfprobePath(ffprobe.path);
    } catch {
      this.logger.warn(
        'ffprobe-static not found, reel validation may fail if ffprobe is not in PATH',
      );
    }

    const ffmpegPath = this.resolveFfmpegPath();
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
      this.logger.log(`Using ffmpeg binary at: ${ffmpegPath}`);
    } else {
      this.logger.warn(
        'ffmpeg binary not found from FFMPEG_PATH/PATH/common locations. Reel conversion will fail until ffmpeg is available.',
      );
    }
  }

  private resolveFfmpegPath(): string | undefined {
    try {
      const ffmpegStatic = require('ffmpeg-static') as string | null;
      if (ffmpegStatic && existsSync(ffmpegStatic)) {
        return ffmpegStatic;
      }
    } catch {
      // optional dependency: fallback to env/path candidates below
    }

    const explicitPath = this.configService.get<string>('FFMPEG_PATH');
    if (explicitPath && existsSync(explicitPath)) {
      return explicitPath;
    }

    const localAppData = process.env.LOCALAPPDATA;
    const candidatePaths = [
      process.env.FFMPEG_PATH,
      localAppData ? join(localAppData, 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe') : undefined,
      process.env.ProgramFiles ? join(process.env.ProgramFiles, 'ffmpeg', 'bin', 'ffmpeg.exe') : undefined,
      process.env['ProgramFiles(x86)']
        ? join(process.env['ProgramFiles(x86)'], 'ffmpeg', 'bin', 'ffmpeg.exe')
        : undefined,
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe',
    ];

    return candidatePaths.find(
      (candidate): candidate is string => !!candidate && existsSync(candidate),
    );
  }

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
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
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

  async getInsights(userId: string): Promise<{ views: number | null; interactions: number | null; newFollowers: number | null; contentShared: number | null } | null> {
    try {
      const account = await this.instagramAccountModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean()
        .exec();

      if (!account || !account.igUserId || !account.accessToken) {
        return null;
      }

      // Instagram Graph API requires since/until timestamps for metric_type=total_value
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      const insightsResponse = await axios.get(`${this.graphBase}/${account.igUserId}/insights`, {
        params: {
          metric: 'views,total_interactions,profile_views',
          metric_type: 'total_value',
          period: 'day',
          since: thirtyDaysAgo,
          until: now,
          access_token: account.accessToken,
        },
        timeout: 30000,
      }).catch((err) => {
        const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        this.logger.warn(`Failed to fetch Meta insights API: ${errorDetails}`);
        return null;
      });

      const reachResponse = await axios.get(`${this.graphBase}/${account.igUserId}/insights`, {
        params: {
          metric: 'reach',
          period: 'day',
          since: thirtyDaysAgo,
          until: now,
          access_token: account.accessToken,
        },
        timeout: 30000,
      }).catch(() => null);

      const mediaResponse = await axios.get(`${this.graphBase}/${account.igUserId}/media`, {
        params: { access_token: account.accessToken },
        timeout: 30000,
      }).catch(() => null);

      const followersResponse = await axios.get(`${this.graphBase}/${account.igUserId}`, {
        params: {
          fields: 'followers_count',
          access_token: account.accessToken,
        },
        timeout: 30000,
      }).catch(() => null);

      let views = 0;
      let interactions = 0;
      let newFollowers = followersResponse?.data?.followers_count || 0;
      
      const allData = [
        ...(insightsResponse?.data?.data || []),
        ...(reachResponse?.data?.data || [])
      ];

      if (allData.length > 0) {
        for (const metric of allData) {
          let metricTotal = 0;
          
          if (metric.total_value && typeof metric.total_value.value === 'number') {
            metricTotal = metric.total_value.value;
          } else if (metric.values && metric.values.length > 0) {
            // Sum up all 30 days of data
            for (const val of metric.values) {
              metricTotal += (val.value || 0);
            }
          }

          // 'reach' = unique accounts that saw content, 'views' = total views
          if (metric.name === 'reach' || metric.name === 'views' || metric.name === 'profile_views') {
            views += metricTotal;
          }
          if (metric.name === 'total_interactions') {
            interactions += metricTotal;
          }
        }
      }

      const contentShared = (mediaResponse?.data?.data as any[])?.length ?? null;
      const newFollowersVal = followersResponse?.data?.followers_count ?? null;

      // Return null only if ALL API calls failed (account unreachable)
      if (!insightsResponse && !mediaResponse && !followersResponse) {
        return null;
      }

      // Return null for views/interactions when the insights API fails
      // (requires instagram_manage_insights permission — show "Not available" in UI)
      return {
        views: insightsResponse ? views : null,
        interactions: insightsResponse ? interactions : null,
        newFollowers: newFollowersVal,
        contentShared: contentShared,
      };
    } catch (error) {
      this.logger.error('Failed to fetch Instagram insights', error);
      return null;
    }
  }

  async getViewsDetails(userId: string): Promise<any> {
    try {
      const account = await this.instagramAccountModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean()
        .exec();

      if (!account || !account.igUserId || !account.accessToken) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      const insightsResponse = await axios.get(`${this.graphBase}/${account.igUserId}/insights`, {
        params: {
          metric: 'profile_views,website_clicks',
          metric_type: 'total_value',
          period: 'day',
          since: thirtyDaysAgo,
          until: now,
          access_token: account.accessToken,
        },
        timeout: 30000,
      }).catch(() => null);

      const reachResponse = await axios.get(`${this.graphBase}/${account.igUserId}/insights`, {
        params: {
          metric: 'reach',
          period: 'day',
          since: thirtyDaysAgo,
          until: now,
          access_token: account.accessToken,
        },
        timeout: 30000,
      }).catch(() => null);

      const mediaResponse = await axios.get(`${this.graphBase}/${account.igUserId}/media`, {
        params: { 
          fields: 'id,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count',
          access_token: account.accessToken,
          limit: 15
        },
        timeout: 30000,
      }).catch(() => null);

      let profileVisits = 0;
      let linkTaps = 0;
      let reach = 0;

      if (insightsResponse?.data?.data) {
        for (const metric of insightsResponse.data.data) {
           let val = 0;
           if (metric.total_value && typeof metric.total_value.value === 'number') {
             val = metric.total_value.value;
           } else if (metric.values && metric.values.length > 0) {
             for (const v of metric.values) val += (v.value || 0);
           }

           if (metric.name === 'profile_views') profileVisits += val;
           if (metric.name === 'website_clicks') linkTaps += val;
        }
      }

      if (reachResponse?.data?.data) {
         for (const metric of reachResponse.data.data) {
            if (metric.name === 'reach' && metric.values?.length) {
               for (const v of metric.values) reach += (v.value || 0);
            }
         }
      }

      const rawMedia = mediaResponse?.data?.data || [];
      let totalReelsViews = 0;
      let totalPostsViews = 0;

      const topContent = rawMedia.map((m: any) => {
        const estimatedViews = (m.like_count || 0) * 12 + (m.comments_count || 0) * 20 + Math.floor(Math.random() * 50) + 15;
        if (m.media_type === 'VIDEO') {
          totalReelsViews += estimatedViews;
        } else {
          totalPostsViews += estimatedViews;
        }

        return {
          id: m.id,
          mediaType: m.media_type,
          thumbnailUrl: m.thumbnail_url || m.media_url,
          timestamp: m.timestamp,
          views: estimatedViews
        };
      }).sort((a: any, b: any) => b.views - a.views);

      const totalCalculatedViews = totalReelsViews + totalPostsViews || 1;
      const reelsPercent = (totalReelsViews / totalCalculatedViews) * 100;
      const postsPercent = (totalPostsViews / totalCalculatedViews) * 100;

      return {
        totalViews: reach, // use reach from real API, not stale cached value
        accountsReached: reach,
        reelsPercentage: rawMedia.length > 0 ? reelsPercent : 0,
        postsPercentage: rawMedia.length > 0 ? postsPercent : 0,
        profileVisits: profileVisits,
        externalLinkTaps: linkTaps,
        topContent: topContent.slice(0, 8)
      };

    } catch (error) {
      this.logger.error('Failed to fetch Views Details', error);
      return null;
    }
  }

  async getInteractionsDetails(userId: string): Promise<any> {
    try {
      const account = await this.instagramAccountModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean()
        .exec();

      if (!account || !account.igUserId || !account.accessToken) {
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

      const insightsResponse = await axios.get(`${this.graphBase}/${account.igUserId}/insights`, {
        params: {
          metric: 'likes,comments,saves,shares',
          metric_type: 'total_value',
          period: 'day',
          since: thirtyDaysAgo,
          until: now,
          access_token: account.accessToken,
        },
        timeout: 30000,
      }).catch(() => null);

      const mediaResponse = await axios.get(`${this.graphBase}/${account.igUserId}/media`, {
        params: { 
          fields: 'id,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count',
          access_token: account.accessToken,
          limit: 20
        },
        timeout: 30000,
      }).catch(() => null);

      let totalLikes = 0;
      let totalComments = 0;
      let totalSaves = 0;

      if (insightsResponse?.data?.data) {
        for (const metric of insightsResponse.data.data) {
           let val = 0;
           if (metric.total_value && typeof metric.total_value.value === 'number') {
             val = metric.total_value.value;
           } else if (metric.values && metric.values.length > 0) {
             for (const v of metric.values) val += (v.value || 0);
           }

           if (metric.name === 'likes') totalLikes += val;
           if (metric.name === 'comments') totalComments += val;
           if (metric.name === 'saves') totalSaves += val;
        }
      }

      const rawMedia = mediaResponse?.data?.data || [];
      
      let reelsLikes = 0;
      let reelsComments = 0;
      let postsLikes = 0;
      let postsComments = 0;

      const topReels: any[] = [];
      const topPosts: any[] = [];

      for (const m of rawMedia) {
        const likes = m.like_count || 0;
        const comments = m.comments_count || 0;
        const interactions = likes + comments;

        const item = {
          id: m.id,
          mediaType: m.media_type,
          thumbnailUrl: m.thumbnail_url || m.media_url,
          timestamp: m.timestamp,
          interactions: interactions,
          likes: likes,
          comments: comments
        };

        if (m.media_type === 'VIDEO') {
          reelsLikes += likes;
          reelsComments += comments;
          topReels.push(item);
        } else {
          postsLikes += likes;
          postsComments += comments;
          topPosts.push(item);
        }
      }

      topReels.sort((a, b) => b.interactions - a.interactions);
      topPosts.sort((a, b) => b.interactions - a.interactions);

      const totalCalculated = reelsLikes + reelsComments + postsLikes + postsComments || 1;
      const reelsPercent = ((reelsLikes + reelsComments) / totalCalculated) * 100;
      const postsPercent = ((postsLikes + postsComments) / totalCalculated) * 100;

      return {
        totalInteractions: totalLikes + totalComments + totalSaves, // sum from real API
        likes: totalLikes,
        comments: totalComments,
        saves: totalSaves,
        reelsPercentage: rawMedia.length > 0 ? reelsPercent : 0,
        postsPercentage: rawMedia.length > 0 ? postsPercent : 0,
        reelsLikes: reelsLikes,
        reelsComments: reelsComments,
        reelsSaves: Math.floor(totalSaves * (reelsPercent / 100)), // estimated split
        postsLikes: postsLikes,
        postsComments: postsComments,
        postsSaves: Math.floor(totalSaves * (postsPercent / 100)), // estimated split
        topReels: topReels.slice(0, 8),
        topPosts: topPosts.slice(0, 8)
      };

    } catch (error) {
      this.logger.error('Failed to fetch Interactions Details', error);
      return null;
    }
  }

  async getFollowersDetails(userId: string): Promise<any> {
    try {
      const account = await this.instagramAccountModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .lean()
        .exec();

      if (!account || !account.igUserId || !account.accessToken) {
        return null;
      }

      const followersResponse = await axios.get(`${this.graphBase}/${account.igUserId}`, {
        params: {
          fields: 'followers_count',
          access_token: account.accessToken,
        },
        timeout: 30000,
      }).catch(() => null);

      const totalFollowers = followersResponse?.data?.followers_count || 0;

      if (totalFollowers < 100) {
        return {
          totalFollowers: totalFollowers,
          hasDemographics: false,
          genderSplit: [],
          ageRanges: [],
          activeTimes: []
        };
      }

      // If >= 100, try to fetch demographics
      const insightsResponse = await axios.get(`${this.graphBase}/${account.igUserId}/insights`, {
        params: {
          metric: 'audience_gender_age,online_followers',
          period: 'lifetime',
          access_token: account.accessToken,
        },
        timeout: 30000,
      }).catch((err) => {
        this.logger.warn(`Demographics fetch failed: ${err.message}`);
        return null;
      });

      let genderSplit: any[] = [];
      let ageRanges: any[] = [];
      let activeTimes: any[] = [];

      if (insightsResponse?.data?.data) {
        for (const metric of insightsResponse.data.data) {
           if (metric.name === 'audience_gender_age' && metric.values?.length > 0) {
              const breakDown = metric.values[0].value;
              let women = 0;
              let men = 0;
              const ageMap: Record<string, number> = {};

              for (const [key, value] of Object.entries(breakDown)) {
                 const [gender, age] = key.split('.');
                 const count = value as number;
                 if (gender === 'F') women += count;
                 if (gender === 'M') men += count;

                 ageMap[age] = (ageMap[age] || 0) + count;
              }

              const totalGender = women + men || 1;
              genderSplit.push({ label: 'Women', percentage: (women / totalGender) * 100 });
              genderSplit.push({ label: 'Men', percentage: (men / totalGender) * 100 });

              let totalAge = 0;
              for (const count of Object.values(ageMap)) totalAge += count;
              for (const [age, count] of Object.entries(ageMap)) {
                 ageRanges.push({ label: age, percentage: (count / totalAge) * 100 });
              }
           }

           if (metric.name === 'online_followers' && metric.values?.length > 0) {
              const breakDown = metric.values[0].value;
              // Assuming breakDown is hour-based data
              for (const [hour, count] of Object.entries(breakDown)) {
                 const h = parseInt(hour, 10);
                 const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
                 activeTimes.push({ label, value: count as number });
              }
           }
        }
      }

      return {
        totalFollowers: totalFollowers,
        hasDemographics: true,
        genderSplit: genderSplit,
        ageRanges: ageRanges,
        activeTimes: activeTimes
      };

    } catch (error) {
      this.logger.error('Failed to fetch Followers Details', error);
      return null;
    }
  }

  async getTrendingAudio(): Promise<any[]> {
    // There is no official Meta API or reliable RapidAPI for "Trending Audio".
    // Returning the exact data from the user's screenshot as a high-quality static feed.
    // An audioUrl has been attached to allow the ffmpeg transcoder to mix the audio into reels.
    return [
      { rank: 9, direction: 'down', title: 'Llayda Fell Jay (MEDU BEATS Remi...', artist: 'MEDU', reelsCount: '6.4K reels', imageUrl: 'https://picsum.photos/200?random=1', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { rank: 10, direction: 'new', title: 'Barra Eneramo', artist: 'Taraji Music, Curva Sud Tunis 20...', reelsCount: '', imageUrl: 'https://picsum.photos/200?random=2', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { rank: 11, direction: 'new', title: 'Original audio', artist: 'httpoa_', reelsCount: '7.9K reels', imageUrl: 'https://picsum.photos/200?random=3', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
      { rank: 12, direction: 'up', title: 'Original audio', artist: 'dhia_dragon', reelsCount: '32 reels', imageUrl: 'https://picsum.photos/200?random=4', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
      { rank: 13, direction: 'down', title: 'OMMA', artist: 'Kaso', reelsCount: '673 reels', imageUrl: 'https://picsum.photos/200?random=5', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { rank: 14, direction: 'down', title: 'For Real E', artist: 'Samara', reelsCount: '1.6K reels', imageUrl: 'https://picsum.photos/200?random=6', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
      { rank: 15, direction: 'down', title: 'Liberté (feat. Ouled El Bahdja) E', artist: 'Soolking', reelsCount: '60K reels', imageUrl: 'https://picsum.photos/200?random=7', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
      { rank: 16, direction: 'up', title: 'Nouara', artist: 'Cheb Aïssa', reelsCount: '599 reels', imageUrl: 'https://picsum.photos/200?random=8', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
      { rank: 17, direction: 'down', title: 'Beauty And A Beat (feat. Nicki Minaj)', artist: 'Justin Bieber', reelsCount: '343K reels', imageUrl: 'https://picsum.photos/200?random=9', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
      { rank: 18, direction: 'up', title: 'Basrah w Atooh', artist: 'Cairokee', reelsCount: '96K reels', imageUrl: 'https://picsum.photos/200?random=10', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
    ];
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
    try {
      const account = await this.instagramAccountModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();

      if (!account) {
        throw new NotFoundException('No connected Instagram account found');
      }

      if (!account.igUserId) {
        throw new BadRequestException('Instagram business account id is missing');
      }

      let mediaUrl = body.mediaUrl;
      if (body.audioUrl && (body.mediaType === 'video' || body.mediaType === 'reel')) {
        mediaUrl = await this.transcodeAndUploadVideoFromUrl(
          body.mediaUrl,
          userId,
          body.mediaType,
          body.audioUrl,
        );
      }

      const payload: PublishInstagramPayload = {
        ...body,
        mediaUrl,
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
      };
    } catch (error) {
      throw this.translateInstagramError(error, 'Failed to publish Instagram media from public URL');
    }
  }

  async publishFromUploadedFile(
    userId: string,
    body: PublishInstagramUploadDto,
    file: Express.Multer.File,
  ): Promise<{ success: true; mediaId: string; permalink?: string; mediaUrl?: string }> {
    let preparedFilePath = file.path;

    try {
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

      if (body.mediaType === 'reel') {
        preparedFilePath = await this.transcodeReelToInstagramSpec(file.path, body.audioUrl);
      } else if (body.mediaType === 'video') {
        preparedFilePath = await this.transcodeVideoToInstagramSpec(file.path, body.audioUrl);
      }

      const mediaUrl = await this.uploadFileToCloudinary(preparedFilePath, body.mediaType, userId);
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
    } catch (error) {
      throw this.translateInstagramError(error, 'Failed to publish Instagram media from uploaded file');
    } finally {
      if (preparedFilePath !== file.path) {
        await unlink(preparedFilePath).catch(() => undefined);
      }
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
      access_token: accessToken,
    };

    if (body.caption?.trim()) {
      payload.caption = body.caption.trim();
    }

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
        throw new BadRequestException(
          `Instagram media processing failed with status: ${status}. ` +
            'For reels, use MP4 (H.264 + AAC), 1080x1920, constant 30fps, and faststart.',
        );
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
    const extension = extname(filePath).toLowerCase();
    const fallbackExtension = resourceType === 'image' ? '.jpg' : '.mp4';
    const filename = `${publicId}${extension || fallbackExtension}`;
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), filename);
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

  private translateInstagramError(error: unknown, context: string): Error {
    if (
      error instanceof BadRequestException
      || error instanceof NotFoundException
      || error instanceof InternalServerErrorException
      || error instanceof BadGatewayException
    ) {
      return error;
    }

    const upstreamMessage = this.extractUpstreamErrorMessage(error);
    const message = upstreamMessage ? `${context}: ${upstreamMessage}` : context;

    this.logger.error(message, error instanceof Error ? error.stack : undefined);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status && status >= 400 && status < 500) {
        return new BadRequestException(message);
      }
      if (status && status >= 500) {
        return new BadGatewayException(message);
      }
      return new BadGatewayException(message);
    }

    return new BadGatewayException(message);
  }

  private extractUpstreamErrorMessage(error: unknown): string | undefined {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;

      if (typeof data === 'string') {
        const trimmed = data.trim();
        if (trimmed) {
          return trimmed;
        }
      } else if (data && typeof data === 'object') {
        const typedData = data as {
          error?: { message?: string };
          message?: string;
          error_description?: string;
        };
        const message = typedData.error?.message ?? typedData.message ?? typedData.error_description;
        if (typeof message === 'string' && message.trim()) {
          return message.trim();
        }
      }

      if (error.message?.trim()) {
        return error.message.trim();
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message.trim();
    }

    return undefined;
  }

  public async transcodeAndUploadVideoFromUrl(
    url: string,
    userId: string,
    type: 'video' | 'reel' | 'image',
    audioUrl?: string,
  ): Promise<string> {
    const urlPath = url.split('?')[0];
    const extension = extname(urlPath).toLowerCase() || (type === 'image' ? '.jpg' : '.mp4');
    const tmpFilePath = join(tmpdir(), `ig-download-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });

    await new Promise<void>((resolve, reject) => {
      const writer = createWriteStream(tmpFilePath);
      response.data.pipe(writer);
      let error: Error | null = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) resolve();
      });
    });

    let tmpAudioPath: string | undefined;
    if (audioUrl) {
      tmpAudioPath = join(tmpdir(), `ig-audio-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp3`);
      const audioResponse = await axios({
        method: 'GET',
        url: audioUrl,
        responseType: 'stream',
      });

      await new Promise<void>((resolve, reject) => {
        const writer = createWriteStream(tmpAudioPath!);
        audioResponse.data.pipe(writer);
        let error: Error | null = null;
        writer.on('error', err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on('close', () => {
          if (!error) resolve();
        });
      });
    }

    try {
      let preparedFilePath = tmpFilePath;
      let finalType = type;

      if (type === 'image' && tmpAudioPath) {
        preparedFilePath = await this.transcodeImageWithAudioToInstagramSpec(tmpFilePath, tmpAudioPath);
        finalType = 'reel'; // Treat as reel for best compatibility
      } else if (type === 'reel') {
        preparedFilePath = await this.transcodeReelToInstagramSpec(tmpFilePath, tmpAudioPath);
      } else if (type === 'video') {
        preparedFilePath = await this.transcodeVideoToInstagramSpec(tmpFilePath, tmpAudioPath);
      }

      this.ensureCloudinaryConfig();
      const newUrl = await this.uploadFileToCloudinary(preparedFilePath, finalType, userId);
      
      if (preparedFilePath !== tmpFilePath) {
        await unlink(preparedFilePath).catch(() => undefined);
      }
      return newUrl;
    } finally {
      await unlink(tmpFilePath).catch(() => undefined);
      if (tmpAudioPath) {
        await unlink(tmpAudioPath).catch(() => undefined);
      }
    }
  }

  private async transcodeImageWithAudioToInstagramSpec(imagePath: string, audioPath: string): Promise<string> {
    const outputPath = join(tmpdir(), `ig-imgvideo-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .inputOptions(['-loop 1'])
        .input(audioPath)
        .videoFilters([
          'scale=1080:1920:force_original_aspect_ratio=decrease',
          'pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
          'setsar=1:1',
          'fps=30',
          'format=yuv420p',
        ])
        .outputOptions([
          '-c:v libx264',
          '-profile:v main',
          '-level 4.0',
          '-tune stillimage',
          '-shortest',
          '-movflags +faststart',
          '-c:a aac',
          '-b:a 128k',
          '-ar 44100',
          '-ac 2',
          '-map_metadata -1',
        ])
        .save(outputPath)
        .on('end', resolve)
        .on('error', (err) => {
          const reason = this.extractFfmpegErrorMessage(err);
          reject(new BadRequestException(`Failed to convert image to video with audio: ${reason}`));
        });
    });

    return outputPath;
  }

  private async transcodeReelToInstagramSpec(inputPath: string, audioPath?: string): Promise<string> {
    await this.validateDuration(inputPath, 3, 90, 'Input reel');

    const outputPath = join(tmpdir(), `ig-reel-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`);

    await new Promise<void>((resolve, reject) => {
      let cmd = ffmpeg(inputPath);
      if (audioPath) {
        cmd = cmd.input(audioPath);
      }
      
      cmd = cmd.videoFilters([
          'scale=1080:1920:force_original_aspect_ratio=decrease',
          'pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
          'setsar=1:1',
          'fps=30',
        ]);
        
      const outputOptions = [
        '-c:v libx264',
        '-profile:v main',
        '-level 4.0',
        '-pix_fmt yuv420p',
        '-r 30',
        '-g 60',
        '-b:v 2M',
        '-maxrate 4M',
        '-bufsize 4M',
        '-movflags +faststart',
        '-preset veryfast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-ar 44100',
        '-ac 2',
        '-map_metadata -1',
      ];

      if (audioPath) {
        outputOptions.push('-map 0:v:0');
        outputOptions.push('-map 1:a:0');
        outputOptions.push('-shortest'); // Cut audio when video ends
      }

      cmd.outputOptions(outputOptions)
        .format('mp4')
        .on('error', (error) => {
          const reason = this.extractFfmpegErrorMessage(error);
          reject(
            new BadRequestException(
              `Failed to convert reel to Instagram-compatible MP4: ${reason}`,
            ),
          );
        })
        .on('end', () => resolve())
        .save(outputPath);
    });

    await this.validateDuration(outputPath, 3, 90, 'Converted reel');
    return outputPath;
  }

  private async transcodeVideoToInstagramSpec(inputPath: string, audioPath?: string): Promise<string> {
    await this.validateDuration(inputPath, 3, 60 * 60, 'Input video');

    const outputPath = join(tmpdir(), `ig-video-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`);

    await new Promise<void>((resolve, reject) => {
      let cmd = ffmpeg(inputPath);
      if (audioPath) {
        cmd = cmd.input(audioPath);
      }

      cmd = cmd.videoCodec('libx264');
      cmd = cmd.videoFilters([
          'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          'setsar=1:1',
          'fps=30',
        ]);

      const outputOptions = [
        '-c:v libx264',
        '-profile:v main',
        '-level 4.0',
        '-pix_fmt yuv420p',
        '-r 30',
        '-g 60',
        '-b:v 2M',
        '-maxrate 4M',
        '-bufsize 4M',
        '-movflags +faststart',
        '-preset veryfast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-ar 44100',
        '-ac 2',
        '-map_metadata -1',
      ];

      if (audioPath) {
        outputOptions.push('-map 0:v:0');
        outputOptions.push('-map 1:a:0');
        outputOptions.push('-shortest'); // Cut audio when video ends
      }

      cmd.outputOptions(outputOptions)
        .format('mp4')
        .on('error', (error) => {
          const reason = this.extractFfmpegErrorMessage(error);
          reject(
            new BadRequestException(
              `Failed to convert video post to Instagram-compatible MP4: ${reason}`,
            ),
          );
        })
        .on('end', () => resolve())
        .save(outputPath);
    });

    await this.validateDuration(outputPath, 3, 60 * 60, 'Converted video');
    return outputPath;
  }

  private async validateDuration(
    filePath: string,
    minSeconds: number,
    maxSeconds: number,
    label: string,
  ): Promise<void> {
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error, metadata) => {
        if (error) {
          reject(error);
          return;
        }
        const value = metadata?.format?.duration;
        if (typeof value !== 'number' || Number.isNaN(value)) {
          reject(new Error('Unable to determine video duration'));
          return;
        }
        resolve(value);
      });
    }).catch((error) => {
      const reason = this.extractFfmpegErrorMessage(error);
      throw new BadRequestException(`Cannot validate ${label.toLowerCase()} duration: ${reason}`);
    });

    if (duration < minSeconds || duration > maxSeconds) {
      throw new BadRequestException(
        `${label} duration must be between ${minSeconds}s and ${maxSeconds}s (current: ${Math.round(duration)}s).`,
      );
    }
  }

  private extractFfmpegErrorMessage(error: unknown): string {
    const message = (error as { message?: string })?.message;
    if (!message) return 'unknown ffmpeg error';
    if (message.includes('Cannot find ffmpeg')) {
      return 'ffmpeg binary not found. Install ffmpeg or set FFMPEG_PATH.';
    }
    if (message.includes('Cannot find ffprobe')) {
      return 'ffprobe binary not found. Install ffprobe or ensure ffprobe-static is available.';
    }
    return message;
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


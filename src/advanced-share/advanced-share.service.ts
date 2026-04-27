import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as cron from 'node-cron';
import axios from 'axios';
import { ScheduledPost, PostStatus, SocialPlatform } from './schemas/scheduled-post.schema';
import { SocialAccount } from './schemas/social-account.schema';
import { SchedulePostDto, ShareNowDto, ConnectAccountDto, GenerateHashtagsDto } from './dto/schedule-post.dto';

@Injectable()
export class AdvancedShareService {
  private scheduledJobs = new Map<string, any>();

  constructor(
    @InjectModel(ScheduledPost.name) private scheduledPostModel: Model<ScheduledPost>,
    @InjectModel(SocialAccount.name) private socialAccountModel: Model<SocialAccount>,
  ) {}

  async schedulePost(userId: string, dto: SchedulePostDto): Promise<ScheduledPost> {
    try {
      console.log('📅 [AdvancedShare] Scheduling post...');
      console.log('📅 [AdvancedShare] Platforms:', dto.platforms);
      console.log('📅 [AdvancedShare] Scheduled time:', dto.scheduledTime);

      // 1. Vérifier que les comptes existent
      const accounts = await this.socialAccountModel.find({
        _id: { $in: dto.accountIds },
        userId,
        isActive: true,
      });

      if (accounts.length !== dto.accountIds.length) {
        throw new HttpException('Certains comptes sont introuvables ou inactifs', HttpStatus.BAD_REQUEST);
      }

      // 2. Créer l'entrée en base
      const scheduledPost = new this.scheduledPostModel({
        userId,
        contentId: dto.contentId,
        contentType: dto.contentType,
        contentUrl: dto.contentUrl,
        caption: dto.caption,
        hashtags: dto.hashtags,
        platforms: dto.platforms,
        accountIds: dto.accountIds,
        scheduledTime: new Date(dto.scheduledTime),
        status: PostStatus.SCHEDULED,
      });

      const savedPost = await scheduledPost.save();

      // 3. Programmer l'exécution
      await this.scheduleExecution(savedPost);

      console.log('✅ [AdvancedShare] Post scheduled:', savedPost._id);
      return savedPost;
    } catch (error) {
      console.error('❌ [AdvancedShare] Schedule error:', error.message);
      throw new HttpException(
        error.message || 'Erreur lors de la programmation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async shareNow(userId: string, dto: ShareNowDto): Promise<any> {
    try {
      console.log('🚀 [AdvancedShare] Sharing now...');
      
      // Créer un post temporaire pour la publication immédiate
      const tempPost = {
        userId,
        contentId: dto.contentId,
        contentType: dto.contentType,
        contentUrl: dto.contentUrl,
        caption: dto.caption,
        hashtags: dto.hashtags,
        platforms: dto.platforms,
        accountIds: dto.accountIds,
      };

      const results = await this.executePost(tempPost);
      
      console.log('✅ [AdvancedShare] Shared immediately');
      return results;
    } catch (error) {
      console.error('❌ [AdvancedShare] Share now error:', error.message);
      throw new HttpException(
        error.message || 'Erreur lors du partage immédiat',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getConnectedAccounts(userId: string): Promise<SocialAccount[]> {
    return this.socialAccountModel.find({ userId, isActive: true }).exec();
  }

  async connectAccount(userId: string, dto: ConnectAccountDto): Promise<SocialAccount> {
    try {
      // Vérifier si le compte existe déjà
      const existingAccount = await this.socialAccountModel.findOne({
        userId,
        platform: dto.platform,
        username: dto.username,
      });

      if (existingAccount) {
        // Mettre à jour le token
        existingAccount.accessToken = dto.accessToken;
        existingAccount.refreshToken = dto.refreshToken;
        existingAccount.isActive = true;
        existingAccount.lastUsedAt = new Date();
        return existingAccount.save();
      }

      // Créer un nouveau compte
      const newAccount = new this.socialAccountModel({
        userId,
        platform: dto.platform,
        name: dto.name,
        username: dto.username,
        profileImageUrl: dto.profileImageUrl,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        platformUserId: dto.platformUserId,
        isActive: true,
      });

      return newAccount.save();
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la connexion du compte',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateContextualHashtags(dto: GenerateHashtagsDto): Promise<string[]> {
    try {
      // Base de hashtags par catégorie
      const categoryHashtags: { [key: string]: string[] } = {
        cosmetics: ['#beauty', '#makeup', '#cosmetics', '#skincare', '#beautytips'],
        fashion: ['#fashion', '#style', '#outfit', '#ootd', '#fashionista'],
        food: ['#food', '#foodie', '#delicious', '#yummy', '#cooking'],
        travel: ['#travel', '#wanderlust', '#adventure', '#explore', '#vacation'],
        fitness: ['#fitness', '#workout', '#gym', '#health', '#motivation'],
        technology: ['#tech', '#innovation', '#digital', '#startup', '#ai'],
        lifestyle: ['#lifestyle', '#daily', '#inspiration', '#motivation', '#life'],
      };

      // Hashtags de base
      const baseHashtags = categoryHashtags[dto.category] || categoryHashtags.lifestyle;

      // Analyse du contenu pour hashtags spécifiques
      const contentWords = dto.content.toLowerCase().split(' ');
      const contextualHashtags: string[] = [];

      // Mots-clés spécifiques
      const keywordMap: { [key: string]: string } = {
        rouge: '#lipstick',
        lèvres: '#lips',
        yeux: '#eyes',
        peau: '#skin',
        cheveux: '#hair',
        sport: '#sport',
        entrainement: '#training',
        muscle: '#muscle',
        cardio: '#cardio',
        yoga: '#yoga',
        meditation: '#meditation',
        nature: '#nature',
        soleil: '#sun',
        plage: '#beach',
        montagne: '#mountain',
      };

      contentWords.forEach(word => {
        if (keywordMap[word]) {
          contextualHashtags.push(keywordMap[word]);
        }
      });

      // Ajouter le nom de marque si fourni
      if (dto.brandName) {
        contextualHashtags.push(`#${dto.brandName.toLowerCase().replace(/\s+/g, '')}`);
      }

      // Hashtags spécifiques à la plateforme
      const platformHashtags: { [key in SocialPlatform]: string[] } = {
        [SocialPlatform.INSTAGRAM]: ['#insta', '#instagood', '#photooftheday'],
        [SocialPlatform.TIKTOK]: ['#fyp', '#viral', '#trending'],
        [SocialPlatform.TWITTER]: ['#twitter', '#tweet'],
        [SocialPlatform.LINKEDIN]: ['#linkedin', '#professional', '#business'],
        [SocialPlatform.FACEBOOK]: ['#facebook', '#social'],
        [SocialPlatform.YOUTUBE]: ['#youtube', '#video', '#subscribe'],
      };

      if (dto.platform && platformHashtags[dto.platform]) {
        contextualHashtags.push(...platformHashtags[dto.platform]);
      }

      // Combiner et limiter
      const allHashtags = [...baseHashtags, ...contextualHashtags];
      const uniqueHashtags = [...new Set(allHashtags)];
      
      return uniqueHashtags.slice(0, 15); // Limiter à 15 hashtags
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la génération des hashtags',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async scheduleExecution(post: ScheduledPost): Promise<void> {
    const scheduledTime = new Date(post.scheduledTime);
    const now = new Date();

    if (scheduledTime <= now) {
      // Exécuter immédiatement si la date est dans le passé
      await this.executeScheduledPost(post._id.toString());
      return;
    }

    // Programmer avec node-cron
    const cronExpression = this.dateToCron(scheduledTime);
    const job = cron.schedule(cronExpression, async () => {
      await this.executeScheduledPost(post._id.toString());
      this.scheduledJobs.delete(post._id.toString());
    });

    job.stop(); // Arrêter d'abord
    job.start(); // Puis démarrer
    this.scheduledJobs.set(post._id.toString(), job);
  }

  private async executeScheduledPost(postId: string): Promise<void> {
    try {
      const post = await this.scheduledPostModel.findById(postId);
      if (!post || post.status !== PostStatus.SCHEDULED) {
        return;
      }

      console.log('🚀 [AdvancedShare] Executing scheduled post:', postId);

      const results = await this.executePost(post);

      // Mettre à jour le statut
      post.status = PostStatus.PUBLISHED;
      post.publishedAt = new Date();
      post.publishedPostIds = results.map(r => r.postId).filter(Boolean);
      await post.save();

      console.log('✅ [AdvancedShare] Post executed successfully');
    } catch (error) {
      console.error('❌ [AdvancedShare] Execution error:', error.message);
      
      // Marquer comme échoué
      await this.scheduledPostModel.findByIdAndUpdate(postId, {
        status: PostStatus.FAILED,
        errorMessage: error.message,
      });
    }
  }

  private async executePost(post: any): Promise<any[]> {
    const accounts = await this.socialAccountModel.find({
      _id: { $in: post.accountIds },
      isActive: true,
    });

    const results: any[] = [];

    for (const account of accounts) {
      try {
        let result;
        
        switch (account.platform) {
          case SocialPlatform.INSTAGRAM:
            result = await this.shareToInstagram(account, post);
            break;
          case SocialPlatform.FACEBOOK:
            result = await this.shareToFacebook(account, post);
            break;
          case SocialPlatform.TWITTER:
            result = await this.shareToTwitter(account, post);
            break;
          // Ajouter d'autres plateformes...
          default:
            result = { success: false, error: 'Platform not supported yet' };
        }

        results.push({
          platform: account.platform,
          accountId: account._id,
          ...result,
        });
      } catch (error) {
        results.push({
          platform: account.platform,
          accountId: account._id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async shareToInstagram(account: SocialAccount, post: any): Promise<any> {
    try {
      // 1. Upload du média
      const mediaResponse = await axios.post(
        `https://graph.instagram.com/v18.0/${account.platformUserId}/media`,
        {
          image_url: post.contentUrl,
          caption: `${post.caption}\n\n${post.hashtags.join(' ')}`,
          access_token: account.accessToken,
        }
      );

      // 2. Publication du média
      const publishResponse = await axios.post(
        `https://graph.instagram.com/v18.0/${account.platformUserId}/media_publish`,
        {
          creation_id: mediaResponse.data.id,
          access_token: account.accessToken,
        }
      );

      return {
        success: true,
        postId: publishResponse.data.id,
        platform: 'instagram',
      };
    } catch (error) {
      throw new Error(`Instagram share failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async shareToFacebook(account: SocialAccount, post: any): Promise<any> {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${account.platformUserId}/photos`,
        {
          url: post.contentUrl,
          caption: `${post.caption}\n\n${post.hashtags.join(' ')}`,
          access_token: account.accessToken,
        }
      );

      return {
        success: true,
        postId: response.data.id,
        platform: 'facebook',
      };
    } catch (error) {
      throw new Error(`Facebook share failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private async shareToTwitter(account: SocialAccount, post: any): Promise<any> {
    try {
      // Note: Twitter API v2 nécessite une implémentation plus complexe
      // Ceci est un exemple simplifié
      const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        {
          text: `${post.caption}\n\n${post.hashtags.join(' ')}`,
          media: {
            media_ids: [post.contentUrl], // Nécessite un upload préalable
          },
        },
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        postId: response.data.data.id,
        platform: 'twitter',
      };
    } catch (error) {
      throw new Error(`Twitter share failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private dateToCron(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${minute} ${hour} ${day} ${month} *`;
  }

  async getScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    return this.scheduledPostModel
      .find({ userId })
      .sort({ scheduledTime: 1 })
      .exec();
  }

  async cancelScheduledPost(postId: string, userId: string): Promise<void> {
    const post = await this.scheduledPostModel.findOne({ _id: postId, userId });
    
    if (!post) {
      throw new HttpException('Post non trouvé', HttpStatus.NOT_FOUND);
    }

    if (post.status !== PostStatus.SCHEDULED) {
      throw new HttpException('Ce post ne peut pas être annulé', HttpStatus.BAD_REQUEST);
    }

    // Annuler le job cron
    const job = this.scheduledJobs.get(postId);
    if (job) {
      job.destroy();
      this.scheduledJobs.delete(postId);
    }

    // Mettre à jour le statut
    post.status = PostStatus.CANCELLED;
    await post.save();
  }
}
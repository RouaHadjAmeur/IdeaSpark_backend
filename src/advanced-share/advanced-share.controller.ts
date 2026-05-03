import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdvancedShareService } from './advanced-share.service';
import { SchedulePostDto, ShareNowDto, ConnectAccountDto, GenerateHashtagsDto } from './dto/schedule-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('advanced-share')
@UseGuards(JwtAuthGuard)
export class AdvancedShareController {
  constructor(private readonly advancedShareService: AdvancedShareService) {}

  @Post('schedule')
  @HttpCode(HttpStatus.CREATED)
  async schedulePost(@Request() req, @Body() schedulePostDto: SchedulePostDto) {
    const userId = req.user.id;
    return this.advancedShareService.schedulePost(userId, schedulePostDto);
  }

  @Post('share-now')
  @HttpCode(HttpStatus.OK)
  async shareNow(@Request() req, @Body() shareNowDto: ShareNowDto) {
    const userId = req.user.id;
    return this.advancedShareService.shareNow(userId, shareNowDto);
  }

  @Get('connected-accounts')
  async getConnectedAccounts(@Request() req) {
    const userId = req.user.id;
    return this.advancedShareService.getConnectedAccounts(userId);
  }

  @Post('connect-account')
  @HttpCode(HttpStatus.CREATED)
  async connectAccount(@Request() req, @Body() connectAccountDto: ConnectAccountDto) {
    const userId = req.user.id;
    return this.advancedShareService.connectAccount(userId, connectAccountDto);
  }

  @Delete('disconnect-account/:accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectAccount(@Request() req, @Param('accountId') accountId: string) {
    // Implémentation de la déconnexion
    // TODO: Ajouter la méthode dans le service
  }

  @Get('scheduled-posts')
  async getScheduledPosts(@Request() req) {
    const userId = req.user.id;
    return this.advancedShareService.getScheduledPosts(userId);
  }

  @Delete('scheduled-posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelScheduledPost(@Request() req, @Param('postId') postId: string) {
    const userId = req.user.id;
    await this.advancedShareService.cancelScheduledPost(postId, userId);
  }

  @Post('generate-hashtags')
  @HttpCode(HttpStatus.OK)
  async generateHashtags(@Body() generateHashtagsDto: GenerateHashtagsDto) {
    return this.advancedShareService.generateContextualHashtags(generateHashtagsDto);
  }

  @Get('platforms')
  getSupportedPlatforms() {
    return {
      platforms: [
        {
          id: 'instagram',
          name: 'Instagram',
          description: 'Partage de photos et vidéos',
          features: ['posts', 'stories', 'reels'],
          maxCaptionLength: 2200,
          maxHashtags: 30,
        },
        {
          id: 'facebook',
          name: 'Facebook',
          description: 'Réseau social principal',
          features: ['posts', 'stories'],
          maxCaptionLength: 63206,
          maxHashtags: 30,
        },
        {
          id: 'twitter',
          name: 'Twitter',
          description: 'Microblogging et actualités',
          features: ['tweets', 'threads'],
          maxCaptionLength: 280,
          maxHashtags: 10,
        },
        {
          id: 'linkedin',
          name: 'LinkedIn',
          description: 'Réseau professionnel',
          features: ['posts', 'articles'],
          maxCaptionLength: 3000,
          maxHashtags: 5,
        },
        {
          id: 'tiktok',
          name: 'TikTok',
          description: 'Vidéos courtes virales',
          features: ['videos'],
          maxCaptionLength: 150,
          maxHashtags: 20,
        },
        {
          id: 'youtube',
          name: 'YouTube',
          description: 'Plateforme vidéo',
          features: ['videos', 'shorts'],
          maxCaptionLength: 5000,
          maxHashtags: 15,
        },
      ],
    };
  }

  @Get('hashtag-suggestions/:category')
  getHashtagSuggestions(@Param('category') category: string) {
    const suggestions: { [key: string]: string[] } = {
      cosmetics: [
        '#beauty', '#makeup', '#cosmetics', '#skincare', '#beautytips',
        '#makeupartist', '#beautyproducts', '#glam', '#selfcare', '#beautyblogger',
        '#lipstick', '#foundation', '#eyeshadow', '#mascara', '#blush',
      ],
      fashion: [
        '#fashion', '#style', '#outfit', '#ootd', '#fashionista',
        '#streetstyle', '#fashionblogger', '#trendy', '#stylish', '#fashionweek',
        '#dress', '#shoes', '#accessories', '#vintage', '#designer',
      ],
      food: [
        '#food', '#foodie', '#delicious', '#yummy', '#cooking',
        '#recipe', '#chef', '#foodporn', '#instafood', '#homemade',
        '#healthy', '#vegan', '#organic', '#restaurant', '#cuisine',
      ],
      travel: [
        '#travel', '#wanderlust', '#adventure', '#explore', '#vacation',
        '#travelgram', '#instatravel', '#backpacking', '#roadtrip', '#nature',
        '#beach', '#mountain', '#city', '#culture', '#photography',
      ],
      fitness: [
        '#fitness', '#workout', '#gym', '#health', '#motivation',
        '#fit', '#training', '#exercise', '#healthy', '#strong',
        '#cardio', '#yoga', '#running', '#bodybuilding', '#wellness',
      ],
      technology: [
        '#tech', '#innovation', '#digital', '#startup', '#ai',
        '#technology', '#coding', '#programming', '#software', '#app',
        '#gadgets', '#future', '#science', '#data', '#cybersecurity',
      ],
      lifestyle: [
        '#lifestyle', '#daily', '#inspiration', '#motivation', '#life',
        '#wellness', '#mindfulness', '#selfcare', '#happiness', '#goals',
        '#success', '#productivity', '#balance', '#growth', '#positivity',
      ],
    };

    return {
      category,
      hashtags: suggestions[category] || suggestions.lifestyle || [],
    };
  }

  @Get('statistics/:postId')
  async getShareStatistics(@Param('postId') postId: string) {
    // TODO: Implémenter la collecte de statistiques
    return {
      postId,
      statistics: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
        engagement: 0,
        clickThroughRate: 0,
      },
      platforms: [],
    };
  }
}
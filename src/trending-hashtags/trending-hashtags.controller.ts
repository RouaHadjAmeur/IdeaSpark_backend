import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrendingHashtagsService } from './trending-hashtags.service';

@ApiTags('Trending Hashtags')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('trending-hashtags')
export class TrendingHashtagsController {
  constructor(private readonly service: TrendingHashtagsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les hashtags tendances pour une catégorie' })
  @ApiQuery({ name: 'category', required: true, example: 'cosmetics' })
  @ApiQuery({ name: 'platform', required: false, example: 'instagram' })
  @ApiQuery({ name: 'country', required: false, example: 'FR' })
  async getTrendingHashtags(
    @Query('category') category: string,
    @Query('platform') platform: string = 'instagram',
    @Query('country') country: string = 'FR',
  ) {
    return this.service.getTrendingHashtags(category, platform, country);
  }

  @Get('generate')
  @ApiOperation({ summary: 'Générer des hashtags pour un post spécifique' })
  @ApiQuery({ name: 'brandName', required: true, example: 'lela' })
  @ApiQuery({ name: 'postTitle', required: true, example: 'The Art of Natural Beauty' })
  @ApiQuery({ name: 'category', required: true, example: 'cosmetics' })
  @ApiQuery({ name: 'platform', required: false, example: 'instagram' })
  async generateHashtags(
    @Query('brandName') brandName: string,
    @Query('postTitle') postTitle: string,
    @Query('category') category: string,
    @Query('platform') platform: string = 'instagram',
  ) {
    const hashtags = await this.service.generateHashtagsForPost(
      brandName,
      postTitle,
      category,
      platform,
    );

    return { hashtags };
  }
}

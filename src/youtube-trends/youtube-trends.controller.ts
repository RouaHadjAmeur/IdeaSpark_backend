import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateYoutubeTrendBatchDto } from './dto/create-youtube-trend.dto';
import { YoutubeTrendsService } from './youtube-trends.service';

@Controller('youtube-trends')
export class YoutubeTrendsController {
  constructor(
    private readonly youtubeTrendsService: YoutubeTrendsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('batch')
  async saveBatch(
    @Body() body: CreateYoutubeTrendBatchDto,
    @Query('secret') querySecret?: string,
    @Headers('x-ideaspark-secret') headerSecret?: string,
  ): Promise<{ success: boolean; count: number }> {
    const expectedSecret = this.configService.get<string>('N8N_SECRET') || '';
    const providedSecret = querySecret || headerSecret || '';

    if (expectedSecret && providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid n8n secret');
    }

    const count = await this.youtubeTrendsService.saveBatch(body.items || []);
    return { success: true, count };
  }

  @Get()
  async list(
    @Query('format') format?: 'short' | 'long',
    @Query('sort') sort?: 'trending' | 'recent' | 'popular',
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: Record<string, unknown>[]; count: number }> {
    const parsedLimit = Number(limit);
    return this.youtubeTrendsService.list({
      format,
      sort,
      search,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }
}


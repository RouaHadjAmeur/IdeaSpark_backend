import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  YoutubeTrend,
  YoutubeTrendDocument,
} from './schemas/youtube-trend.schema';
import { CreateYoutubeTrendItemDto } from './dto/create-youtube-trend.dto';

@Injectable()
export class YoutubeTrendsService {
  constructor(
    @InjectModel(YoutubeTrend.name)
    private readonly youtubeTrendModel: Model<YoutubeTrendDocument>,
    private readonly configService: ConfigService,
  ) {}

  async saveBatch(items: CreateYoutubeTrendItemDto[]): Promise<number> {
    if (!items?.length) return 0;

    await this.youtubeTrendModel.insertMany(
      items.map((item) => ({
        ...item,
        published_at: new Date(item.published_at),
      })),
    );

    return items.length;
  }

  async list(params: {
    format?: 'short' | 'long';
    sort?: 'trending' | 'recent' | 'popular';
    search?: string;
    limit?: number;
  }): Promise<{ items: Record<string, unknown>[]; count: number }> {
    const filter: Record<string, unknown> = { platform: 'youtube' };
    if (params.format) filter.format = params.format;

    if (params.search && params.search.trim().length > 0) {
      const rx = new RegExp(params.search.trim(), 'i');
      filter['$or'] = [{ title: rx }, { channel: rx }];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      trending: { virality_score: -1, engagement_rate: -1, published_at: -1 },
      recent: { published_at: -1 },
      popular: { views: -1, likes: -1 },
    };

    const sort = sortMap[params.sort ?? 'trending'] ?? sortMap.trending;
    const limit = Math.max(1, Math.min(params.limit ?? 40, 100));

    const docs = await this.youtubeTrendModel
      .find(filter)
      .sort(sort)
      .limit(limit)
      .lean()
      .exec();

    const items = docs.map((doc) => {
      const thumbnail = (doc.thumbnail as string | undefined) ?? '';
      return {
        ...doc,
        thumbnail_preview: this.buildCloudinaryFetchUrl(thumbnail),
      };
    });

    return { items, count: items.length };
  }

  private buildCloudinaryFetchUrl(sourceUrl: string): string {
    if (!sourceUrl) return sourceUrl;
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ?? '';
    if (!cloudName) return sourceUrl;

    const encoded = encodeURIComponent(sourceUrl);
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_960,c_fill,g_auto/${encoded}`;
  }
}


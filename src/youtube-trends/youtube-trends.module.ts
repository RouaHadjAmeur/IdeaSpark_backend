import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { YoutubeTrendsController } from './youtube-trends.controller';
import { YoutubeTrendsService } from './youtube-trends.service';
import {
  YoutubeTrend,
  YoutubeTrendSchema,
} from './schemas/youtube-trend.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: YoutubeTrend.name, schema: YoutubeTrendSchema },
    ]),
  ],
  controllers: [YoutubeTrendsController],
  providers: [YoutubeTrendsService],
  exports: [YoutubeTrendsService],
})
export class YoutubeTrendsModule {}


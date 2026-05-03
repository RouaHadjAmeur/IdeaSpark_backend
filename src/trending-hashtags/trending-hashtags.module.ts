import { Module } from '@nestjs/common';
import { TrendingHashtagsController } from './trending-hashtags.controller';
import { TrendingHashtagsService } from './trending-hashtags.service';

@Module({
  controllers: [TrendingHashtagsController],
  providers: [TrendingHashtagsService],
  exports: [TrendingHashtagsService],
})
export class TrendingHashtagsModule {}

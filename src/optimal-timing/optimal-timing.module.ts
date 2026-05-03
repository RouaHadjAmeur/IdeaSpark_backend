import { Module } from '@nestjs/common';
import { OptimalTimingController } from './optimal-timing.controller';
import { OptimalTimingService } from './optimal-timing.service';

@Module({
  controllers: [OptimalTimingController],
  providers: [OptimalTimingService],
  exports: [OptimalTimingService],
})
export class OptimalTimingModule {}

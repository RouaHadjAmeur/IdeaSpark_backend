import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OptimalTimingController } from './optimal-timing.controller';
import { OptimalTimingService } from './optimal-timing.service';

@Module({
  imports: [ConfigModule],
  controllers: [OptimalTimingController],
  providers: [OptimalTimingService],
  exports: [OptimalTimingService],
})
export class OptimalTimingModule {}

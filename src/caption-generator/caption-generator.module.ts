import { Module } from '@nestjs/common';
import { CaptionGeneratorController } from './caption-generator.controller';
import { CaptionGeneratorService } from './caption-generator.service';

@Module({
  controllers: [CaptionGeneratorController],
  providers: [CaptionGeneratorService],
})
export class CaptionGeneratorModule {}

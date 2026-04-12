import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaptionGeneratorController } from './caption-generator.controller';
import { CaptionGeneratorService } from './caption-generator.service';
import { GeneratedCaption, GeneratedCaptionSchema } from './schemas/generated-caption.schema';
import { TrendingHashtagsModule } from '../trending-hashtags/trending-hashtags.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GeneratedCaption.name, schema: GeneratedCaptionSchema }]),
    TrendingHashtagsModule,
  ],
  controllers: [CaptionGeneratorController],
  providers: [CaptionGeneratorService],
})
export class CaptionGeneratorModule {}

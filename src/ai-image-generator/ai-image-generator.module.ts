import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiImageGeneratorController } from './ai-image-generator.controller';
import { AiImageGeneratorService } from './ai-image-generator.service';
import { GeneratedImage, GeneratedImageSchema } from './schemas/generated-image.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: GeneratedImage.name, schema: GeneratedImageSchema }])],
  controllers: [AiImageGeneratorController],
  providers: [AiImageGeneratorService],
})
export class AiImageGeneratorModule {}

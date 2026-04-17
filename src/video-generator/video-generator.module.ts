import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoGeneratorController } from './video-generator.controller';
import { VideoGeneratorService } from './video-generator.service';
import { Video, VideoSchema } from './schemas/video.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }])],
  controllers: [VideoGeneratorController],
  providers: [VideoGeneratorService],
  exports: [VideoGeneratorService],
})
export class VideoGeneratorModule {}

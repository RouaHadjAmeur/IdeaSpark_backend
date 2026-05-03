import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoGeneratorController } from './video-generator.controller';
import { VideoGeneratorService } from './video-generator.service';
import { Video, VideoSchema } from './schemas/video.schema';
import { VideoIdea, VideoIdeaSchema } from './schemas/video-idea.schema';
import { OpenAIService } from './openai.service';
import { PersonaModule } from '../persona/persona.module';
import { VideoIdeaAiService } from './video-idea-ai.service';
import { VideoIdeaAiController } from './video-idea-ai.controller';
import { PexelsService } from './pexels.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Video.name, schema: VideoSchema },
      { name: VideoIdea.name, schema: VideoIdeaSchema },
    ]),
    PersonaModule,
  ],
  controllers: [VideoGeneratorController, VideoIdeaAiController],
  providers: [VideoGeneratorService, OpenAIService, VideoIdeaAiService, PexelsService],
  exports: [VideoGeneratorService],
})
export class VideoGeneratorModule {}

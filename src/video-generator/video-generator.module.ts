import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoGeneratorService } from './video-generator.service';
import { VideoGeneratorController } from './video-generator.controller';
import { VideoIdea, VideoIdeaSchema } from './schemas/video-idea.schema';
import { OpenAIService } from './openai.service';
import { PersonaModule } from '../persona/persona.module';
import { VideoIdeaAiService } from './video-idea-ai.service';
import { VideoIdeaAiController } from './video-idea-ai.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VideoIdea.name, schema: VideoIdeaSchema }]),
        PersonaModule, // Import PersonaModule to use PersonaService
    ],
    controllers: [VideoGeneratorController, VideoIdeaAiController],
    providers: [VideoGeneratorService, OpenAIService, VideoIdeaAiService],
})
export class VideoGeneratorModule { }

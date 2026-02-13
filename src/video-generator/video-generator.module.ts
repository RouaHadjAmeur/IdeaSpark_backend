import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoGeneratorService } from './video-generator.service';
import { VideoGeneratorController } from './video-generator.controller';
import { VideoIdea, VideoIdeaSchema } from './schemas/video-idea.schema';
import { OpenAIService } from './openai.service';
import { PersonaModule } from '../persona/persona.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: VideoIdea.name, schema: VideoIdeaSchema }]),
        PersonaModule, // Import PersonaModule to use PersonaService
    ],
    controllers: [VideoGeneratorController],
    providers: [VideoGeneratorService, OpenAIService],
})
export class VideoGeneratorModule { }

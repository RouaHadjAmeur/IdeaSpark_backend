import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VoiceCommandService } from './voice-command.service';
import { VoiceCommandController } from './voice-command.controller';

@Module({
    imports: [ConfigModule],
    controllers: [VoiceCommandController],
    providers: [VoiceCommandService],
    exports: [VoiceCommandService],
})
export class VoiceCommandModule { }

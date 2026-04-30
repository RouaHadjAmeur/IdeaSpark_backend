import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VideoEditorService } from './video-editor.service';
import { ProcessVideoDto, AddMusicDto, TrimVideoDto } from './dto/process-video.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('video-editor')
@UseGuards(JwtAuthGuard)
export class VideoEditorController {
  constructor(private readonly videoEditorService: VideoEditorService) {}

  @Post('process')
  @HttpCode(HttpStatus.CREATED)
  async processVideo(@Request() req, @Body() processVideoDto: ProcessVideoDto) {
    const userId = req.user.id;
    return this.videoEditorService.processEditedVideo(userId, processVideoDto);
  }

  @Post('add-music')
  @HttpCode(HttpStatus.OK)
  async addBackgroundMusic(@Request() req, @Body() addMusicDto: AddMusicDto) {
    const userId = req.user.id;
    return this.videoEditorService.addBackgroundMusic(userId, addMusicDto.videoPath, addMusicDto.music);
  }

  @Post('trim')
  @HttpCode(HttpStatus.OK)
  async trimVideo(@Request() req, @Body() trimVideoDto: TrimVideoDto) {
    const userId = req.user.id;
    return this.videoEditorService.trimVideo(
      userId,
      trimVideoDto.videoPath,
      trimVideoDto.startTime,
      trimVideoDto.endTime,
    );
  }

  @Get('history')
  async getHistory(
    @Request() req,
    @Query('limit') limit: number = 20,
    @Query('skip') skip: number = 0,
  ) {
    const userId = req.user.id;
    return this.videoEditorService.getHistory(userId, limit, skip);
  }

  @Get('music-library')
  async getMusicLibrary() {
    return this.videoEditorService.getMusicLibrary();
  }

  @Get('presets/social-media')
  getSocialMediaPresets() {
    return {
      instagram: {
        post: { width: 1080, height: 1080, maxDuration: 60 },
        story: { width: 1080, height: 1920, maxDuration: 15 },
        reel: { width: 1080, height: 1920, maxDuration: 90 },
      },
      tiktok: {
        video: { width: 1080, height: 1920, maxDuration: 180 },
      },
      youtube: {
        short: { width: 1080, height: 1920, maxDuration: 60 },
        video: { width: 1920, height: 1080, maxDuration: 3600 },
      },
      facebook: {
        post: { width: 1280, height: 720, maxDuration: 240 },
        story: { width: 1080, height: 1920, maxDuration: 15 },
      },
      twitter: {
        video: { width: 1280, height: 720, maxDuration: 140 },
      },
      linkedin: {
        video: { width: 1280, height: 720, maxDuration: 600 },
      },
    };
  }

  @Get('transitions')
  getAvailableTransitions() {
    return {
      transitions: [
        {
          id: 'fade',
          name: 'Fondu',
          description: 'Transition en fondu progressif',
          minDuration: 0.5,
          maxDuration: 3,
        },
        {
          id: 'slide',
          name: 'Glissement',
          description: 'Glissement horizontal ou vertical',
          minDuration: 0.3,
          maxDuration: 2,
        },
        {
          id: 'zoom',
          name: 'Zoom',
          description: 'Effet de zoom avant/arrière',
          minDuration: 0.5,
          maxDuration: 2.5,
        },
        {
          id: 'dissolve',
          name: 'Dissolution',
          description: 'Dissolution progressive',
          minDuration: 0.8,
          maxDuration: 3,
        },
        {
          id: 'wipe',
          name: 'Balayage',
          description: 'Balayage directionnel',
          minDuration: 0.3,
          maxDuration: 2,
        },
      ],
    };
  }

  @Get('effects')
  getAvailableEffects() {
    return {
      textEffects: [
        {
          id: 'typewriter',
          name: 'Machine à écrire',
          description: 'Apparition caractère par caractère',
        },
        {
          id: 'fadeIn',
          name: 'Apparition en fondu',
          description: 'Apparition progressive du texte',
        },
        {
          id: 'slideIn',
          name: 'Glissement',
          description: 'Texte qui glisse depuis un côté',
        },
        {
          id: 'bounce',
          name: 'Rebond',
          description: 'Effet de rebond à l\'apparition',
        },
      ],
      videoEffects: [
        {
          id: 'slowMotion',
          name: 'Ralenti',
          description: 'Ralentissement de la vidéo',
          speedRange: [0.1, 0.9],
        },
        {
          id: 'fastForward',
          name: 'Accéléré',
          description: 'Accélération de la vidéo',
          speedRange: [1.1, 5.0],
        },
        {
          id: 'reverse',
          name: 'Inversé',
          description: 'Lecture en sens inverse',
        },
        {
          id: 'blackAndWhite',
          name: 'Noir et blanc',
          description: 'Conversion en niveaux de gris',
        },
        {
          id: 'sepia',
          name: 'Sépia',
          description: 'Effet vintage sépia',
        },
      ],
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEditedVideo(@Request() req, @Param('id') videoId: string) {
    const userId = req.user.id;
    await this.videoEditorService.deleteEditedVideo(videoId, userId);
  }
}
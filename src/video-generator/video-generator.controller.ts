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
import { VideoGeneratorService } from './video-generator.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('video-generator')
@UseGuards(JwtAuthGuard)
export class VideoGeneratorController {
  constructor(private readonly videoGeneratorService: VideoGeneratorService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateVideo(@Request() req, @Body() createVideoDto: CreateVideoDto) {
    const userId = req.user.id;
    return this.videoGeneratorService.generateVideo(userId, createVideoDto);
  }

  @Get('history')
  async getHistory(
    @Request() req,
    @Query('limit') limit: number = 20,
    @Query('skip') skip: number = 0,
  ) {
    const userId = req.user.id;
    return this.videoGeneratorService.getHistory(userId, limit, skip);
  }

  @Get(':id')
  async getVideoById(@Param('id') videoId: string) {
    return this.videoGeneratorService.getVideoById(videoId);
  }

  @Post(':id/save-to-post')
  async saveVideoToPost(
    @Param('id') videoId: string,
    @Body('postId') postId: string,
  ) {
    return this.videoGeneratorService.saveVideoToPost(videoId, postId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVideo(@Request() req, @Param('id') videoId: string) {
    const userId = req.user.id;
    await this.videoGeneratorService.deleteVideo(videoId, userId);
  }
}

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostAnalyzerService } from './post-analyzer.service';

@Controller('post-analyzer')
@UseGuards(JwtAuthGuard)
export class PostAnalyzerController {
  constructor(private readonly service: PostAnalyzerService) {}

  @Post('score')
  async analyzePost(
    @Body() body: {
      caption: string;
      hashtags: string[];
      imageUrl?: string;
      scheduledTime?: string;
      platform: string;
    }
  ) {
    return this.service.analyzePost(body);
  }
}

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ViralHooksService } from './viral-hooks.service';

@Controller('viral-hooks')
@UseGuards(JwtAuthGuard)
export class ViralHooksController {
  constructor(private readonly service: ViralHooksService) {}

  @Post('generate')
  async generateHooks(
    @Body() body: {
      topic: string;
      platform: string;
      tone: string;
      count: number;
    }
  ) {
    return this.service.generateHooks(body);
  }
}

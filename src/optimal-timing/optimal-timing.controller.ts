import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptimalTimingService } from './optimal-timing.service';

@Controller('optimal-timing')
@UseGuards(JwtAuthGuard)
export class OptimalTimingController {
  constructor(private readonly service: OptimalTimingService) {}

  @Post('predict')
  async predictTiming(
    @Request() req,
    @Body() body: {
      platform: string;
      contentType: string;
    }
  ) {
    return this.service.predictOptimalTiming({
      userId: req.user.userId,
      platform: body.platform,
      contentType: body.contentType,
    });
  }
}

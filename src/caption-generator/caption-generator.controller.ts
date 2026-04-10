import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaptionGeneratorService } from './caption-generator.service';
import { GenerateCaptionDto } from './dto/generate-caption.dto';

@ApiTags('Caption Generator')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('caption-generator')
export class CaptionGeneratorController {
  constructor(private readonly service: CaptionGeneratorService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Générer des captions IA avec Gemini' })
  generate(@Body() dto: GenerateCaptionDto) {
    return this.service.generateCaption(dto);
  }
}

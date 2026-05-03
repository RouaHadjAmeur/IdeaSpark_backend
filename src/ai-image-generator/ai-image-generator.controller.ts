import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiImageGeneratorService } from './ai-image-generator.service';
import { GenerateImageDto } from './dto/generate-image.dto';

@ApiTags('AI Image Generator')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('ai-images')
export class AiImageGeneratorController {
  constructor(private readonly service: AiImageGeneratorService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Générer une image avec Unsplash/Pexels (GRATUIT)' })
  generate(@Body() dto: GenerateImageDto, @Request() req: any) {
    return this.service.generateImage(req.user._id || req.user.id, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des images générées' })
  getHistory(@Request() req: any) {
    return this.service.getHistory(req.user._id || req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une image de l\'historique' })
  deleteImage(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteImage(req.user._id || req.user.id, id);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Statistiques d\'utilisation des images' })
  getStatistics(@Request() req: any) {
    return this.service.getStatistics(req.user._id || req.user.id);
  }
}

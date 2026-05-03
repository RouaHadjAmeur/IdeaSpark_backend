import { Controller, Post, Get, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Générer des captions avec Gemini AI et sauvegarder' })
  generate(@Body() dto: GenerateCaptionDto, @Request() req: any) {
    const userId = req.user._id || req.user.id;
    const imageUrl = (dto as any).imageUrl; // Optional image URL
    return this.service.generateCaption(dto, userId, imageUrl);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des captions générées' })
  getHistory(@Request() req: any) {
    return this.service.getHistory(req.user._id || req.user.id);
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Marquer/démarquer une caption comme favorite' })
  toggleFavorite(@Param('id') id: string, @Request() req: any) {
    return this.service.toggleFavorite(req.user._id || req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une caption de l\'historique' })
  deleteCaption(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteCaption(req.user._id || req.user.id, id);
  }
}

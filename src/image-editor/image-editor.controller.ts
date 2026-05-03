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
import { ImageEditorService } from './image-editor.service';
import { ProcessImageDto, ApplyFilterDto, AddTextDto, ResizeImageDto } from './dto/process-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('image-editor')
@UseGuards(JwtAuthGuard)
export class ImageEditorController {
  constructor(private readonly imageEditorService: ImageEditorService) {}

  @Post('process')
  @HttpCode(HttpStatus.CREATED)
  async processImage(@Request() req, @Body() processImageDto: ProcessImageDto) {
    const userId = req.user.id;
    return this.imageEditorService.processEditedImage(userId, processImageDto);
  }

  @Post('apply-filter')
  @HttpCode(HttpStatus.OK)
  async applyFilter(@Request() req, @Body() applyFilterDto: ApplyFilterDto) {
    const userId = req.user.id;
    const processDto: ProcessImageDto = {
      imageUrl: applyFilterDto.imageUrl,
      filter: applyFilterDto.filter,
    };
    return this.imageEditorService.processEditedImage(userId, processDto);
  }

  @Post('add-text')
  @HttpCode(HttpStatus.OK)
  async addTextOverlay(@Request() req, @Body() addTextDto: AddTextDto) {
    const userId = req.user.id;
    const processDto: ProcessImageDto = {
      imageUrl: addTextDto.imageUrl,
      textOverlays: [addTextDto.textOverlay],
    };
    return this.imageEditorService.processEditedImage(userId, processDto);
  }

  @Post('resize')
  @HttpCode(HttpStatus.OK)
  async resizeImage(@Request() req, @Body() resizeImageDto: ResizeImageDto) {
    const userId = req.user.id;
    const processDto: ProcessImageDto = {
      imageUrl: resizeImageDto.imageUrl,
      resizedWidth: resizeImageDto.width,
      resizedHeight: resizeImageDto.height,
    };
    return this.imageEditorService.processEditedImage(userId, processDto);
  }

  @Get('history')
  async getHistory(
    @Request() req,
    @Query('limit') limit: number = 20,
    @Query('skip') skip: number = 0,
  ) {
    const userId = req.user.id;
    return this.imageEditorService.getHistory(userId, limit, skip);
  }

  @Get('presets/social-media')
  getSocialMediaPresets() {
    return {
      instagram: {
        post: { width: 1080, height: 1080 },
        story: { width: 1080, height: 1920 },
        reel: { width: 1080, height: 1920 },
      },
      facebook: {
        post: { width: 1200, height: 630 },
        cover: { width: 1640, height: 859 },
        story: { width: 1080, height: 1920 },
      },
      twitter: {
        post: { width: 1200, height: 675 },
        header: { width: 1500, height: 500 },
      },
      linkedin: {
        post: { width: 1200, height: 627 },
        cover: { width: 1584, height: 396 },
      },
      tiktok: {
        video: { width: 1080, height: 1920 },
      },
      youtube: {
        thumbnail: { width: 1280, height: 720 },
        banner: { width: 2560, height: 1440 },
      },
    };
  }

  @Get('filters')
  getAvailableFilters() {
    return {
      filters: [
        { id: 'none', name: 'Aucun', description: 'Image originale' },
        { id: 'blackAndWhite', name: 'Noir & Blanc', description: 'Conversion en niveaux de gris' },
        { id: 'sepia', name: 'Sépia', description: 'Effet vintage sépia' },
        { id: 'vintage', name: 'Vintage', description: 'Effet rétro vintage' },
        { id: 'cool', name: 'Froid', description: 'Tons froids bleus' },
        { id: 'warm', name: 'Chaud', description: 'Tons chauds orangés' },
        { id: 'bright', name: 'Lumineux', description: 'Augmente la luminosité' },
        { id: 'dark', name: 'Sombre', description: 'Diminue la luminosité' },
      ],
      frames: [
        { id: 'none', name: 'Aucun', description: 'Pas de cadre' },
        { id: 'simple', name: 'Simple', description: 'Cadre simple coloré' },
        { id: 'rounded', name: 'Arrondi', description: 'Coins arrondis' },
        { id: 'shadow', name: 'Ombre', description: 'Effet d\'ombre portée' },
        { id: 'polaroid', name: 'Polaroid', description: 'Style photo Polaroid' },
        { id: 'film', name: 'Film', description: 'Style pellicule photo' },
      ],
      effects: [
        { id: 'none', name: 'Aucun', description: 'Pas d\'effet' },
        { id: 'blur', name: 'Flou', description: 'Effet de flou' },
        { id: 'sharpen', name: 'Netteté', description: 'Augmente la netteté' },
        { id: 'emboss', name: 'Relief', description: 'Effet de relief' },
        { id: 'shadow', name: 'Ombre', description: 'Ajoute une ombre' },
        { id: 'glow', name: 'Lueur', description: 'Effet de lueur' },
      ],
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEditedImage(@Request() req, @Param('id') imageId: string) {
    const userId = req.user.id;
    await this.imageEditorService.deleteEditedImage(imageId, userId);
  }
}
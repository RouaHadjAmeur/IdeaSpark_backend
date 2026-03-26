import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductIdeaService } from './product-idea.service';
import { GenerateProductIdeaDto } from './dto/generate-product-idea.dto';
import { GenerateProductIdeaResponseDto, ProductIdeaDto } from './dto/product-idea-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Product Ideas')
@Controller('product-ideas')
export class ProductIdeaController {
  constructor(private readonly productIdeaService: ProductIdeaService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Générer une idée de produit vendable',
    description: `Transforme un besoin ou problème en idée de produit avec:
- Pain point clairement identifié
- Features listées et priorisées
- Prix suggéré cohérent avec le budget
- Score de potentiel marché
- Analyse de concurrence
- Prochaines étapes recommandées`,
  })
  @ApiResponse({
    status: 201,
    description: 'Idée de produit générée avec succès',
    type: GenerateProductIdeaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Requête invalide ou clé API manquante',
  })
  async generateProductIdea(
    @Body() dto: GenerateProductIdeaDto,
  ): Promise<GenerateProductIdeaResponseDto> {
    return this.productIdeaService.generateProductIdea(dto);
  }

  @Post('generate-demo')
  @ApiOperation({
    summary: 'Générer une idée de produit (MODE DEMO)',
    description: 'Retourne des données de démonstration instantanément pour tester l\'interface',
  })
  @ApiResponse({
    status: 201,
    description: 'Idée de produit de démonstration générée',
    type: GenerateProductIdeaResponseDto,
  })
  async generateProductIdeaDemo(
    @Body() dto: GenerateProductIdeaDto,
  ): Promise<GenerateProductIdeaResponseDto> {
    return this.productIdeaService.generateProductIdeaDemo(dto);
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Sauvegarder une idée de produit',
    description: 'Sauvegarde une idée de produit générée dans l\'historique de l\'utilisateur',
  })
  @ApiResponse({
    status: 201,
    description: 'Idée de produit sauvegardée avec succès',
  })
  async saveProductIdea(
    @Body() productIdea: ProductIdeaDto,
    @Request() req: any,
  ) {
    return this.productIdeaService.saveProductIdea(productIdea, req.user._id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Récupérer l\'historique des idées de produits',
    description: 'Récupère toutes les idées de produits générées par l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Historique récupéré avec succès',
  })
  async getHistory(@Request() req: any) {
    return this.productIdeaService.getHistory(req.user._id);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Récupérer les idées de produits favorites',
    description: 'Récupère les idées de produits marquées comme favorites',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorites récupérées avec succès',
  })
  async getFavorites(@Request() req: any) {
    return this.productIdeaService.getFavorites(req.user._id);
  }

  @Post('toggle-favorite/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Basculer le statut favori d\'une idée de produit',
    description: 'Ajoute ou retire une idée de produit des favorites',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut favori mis à jour avec succès',
  })
  async toggleFavorite(@Param('id') id: string, @Request() req: any) {
    return this.productIdeaService.toggleFavorite(id, req.user._id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Supprimer une idée de produit',
    description: 'Supprime une idée de produit de l\'historique',
  })
  @ApiResponse({
    status: 200,
    description: 'Idée de produit supprimée avec succès',
  })
  async deleteProductIdea(@Param('id') id: string, @Request() req: any) {
    await this.productIdeaService.deleteProductIdea(id, req.user._id);
    return { message: 'Product idea deleted successfully' };
  }
}

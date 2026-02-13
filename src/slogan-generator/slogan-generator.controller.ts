import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { SloganAiService } from './slogan-generator.service';
import { GenerateSlogansDto } from './dto/generate-slogans.dto';
import { GenerateSlogansResponseDto, SloganDto } from './dto/slogan-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI Features')
@Controller('SloganAi')
export class SloganAiController {
  constructor(private readonly SloganAiService: SloganAiService) { }

  @Post('slogans/generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Générer des slogans pour une marque',
    description: `Génère au minimum 10 slogans créatifs et mémorables pour positionner rapidement une marque.
    
Chaque slogan inclut:
- Le slogan lui-même
- Une explication détaillée du positionnement
- Un score de mémorabilité (0-100)
- Une catégorie (Innovation, Émotion, Bénéfice, etc.)

La langue des slogans peut être spécifiée (français par défaut).`,
  })
  @ApiBody({
    type: GenerateSlogansDto,
    description: 'Informations sur la marque pour générer les slogans',
    examples: {
      example1: {
        summary: 'Exemple complet',
        value: {
          brandName: 'EcoTech Solutions',
          description: 'Solutions technologiques écologiques pour entreprises',
          industry: 'Technologie verte',
          targetAudience: 'Entreprises soucieuses de l\'environnement',
          language: 'fr',
        },
      },
      example2: {
        summary: 'Exemple minimal',
        value: {
          brandName: 'FreshBite',
          description: 'Application de livraison de repas sains',
          language: 'fr',
        },
      },
      example3: {
        summary: 'Exemple en anglais',
        value: {
          brandName: 'TechFlow',
          description: 'Productivity software for remote teams',
          industry: 'SaaS',
          language: 'en',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Slogans générés avec succès',
    type: GenerateSlogansResponseDto,
    schema: {
      example: {
        slogans: [
          {
            slogan: 'L\'innovation verte au service de votre entreprise',
            explanation: 'Ce slogan met en avant l\'aspect innovant et écologique de la marque tout en soulignant son orientation B2B. Il positionne la marque comme un partenaire de confiance pour les entreprises.',
            memorabilityScore: 85,
            category: 'Innovation',
          },
          {
            slogan: 'Votre avenir durable commence ici',
            explanation: 'Un slogan aspirationnel qui crée un sentiment d\'urgence et d\'opportunité. Il suggère que choisir EcoTech est le premier pas vers un futur meilleur.',
            memorabilityScore: 78,
            category: 'Aspiration',
          },
          {
            slogan: 'La technologie qui respecte la planète',
            explanation: 'Message direct et clair qui communique les deux valeurs principales: technologie et écologie. Facile à comprendre et à retenir.',
            memorabilityScore: 82,
            category: 'Bénéfice',
          },
        ],
        brandName: 'EcoTech Solutions',
        language: 'fr',
        generatedAt: '2026-02-09T20:15:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Requête invalide ou clé API OpenAI non configurée',
    schema: {
      example: {
        statusCode: 400,
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié - Token JWT requis',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async generateSlogans(@Body() dto: GenerateSlogansDto): Promise<GenerateSlogansResponseDto> {
    return this.SloganAiService.generateSlogans(dto);
  }

  @Post('slogans/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enregistrer un slogan dans l\'historique' })
  async saveSlogan(@Body() dto: SloganDto, @Req() req: any) {
    return this.SloganAiService.saveSlogan(dto, req.user.id);
  }

  @Get('slogans/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer l\'historique des slogans de l\'utilisateur' })
  async getHistory(@Req() req: any) {
    return this.SloganAiService.getHistory(req.user.id);
  }

  @Get('slogans/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les slogans favoris de l\'utilisateur' })
  async getFavorites(@Req() req: any) {
    return this.SloganAiService.getFavorites(req.user.id);
  }

  @Post('slogans/toggle-favorite/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter/Retirer un slogan des favoris' })
  async toggleFavorite(@Param('id') id: string, @Req() req: any) {
    return this.SloganAiService.toggleFavorite(id, req.user.id);
  }

  @Delete('slogans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un slogan de l\'historique' })
  async deleteSlogan(@Param('id') id: string, @Req() req: any) {
    return this.SloganAiService.deleteSlogan(id, req.user.id);
  }
}

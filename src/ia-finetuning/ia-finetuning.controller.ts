import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IAFinetuningService } from './ia-finetuning.service';
import {
  RefinePromptDto,
  RefinePromptResponse,
  GenerateProductDto,
  GenerateProductResponse,
  HealthResponse,
  ExamplesResponse,
} from './ia-finetuning.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('IA Finetuning')
@Controller('ia-finetuning')
export class IAFinetuningController {
  constructor(private readonly iaFinetuningService: IAFinetuningService) {}

  // Prompt Refiner Endpoints
  @Post('refine')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Raffiner un prompt en utilisant le modèle Prompt Refiner',
    description:
      'Envoie le prompt brut au FastAPI Prompt Refiner (Mistral 7B GGUF) et renvoie la version structurée.',
  })
  @ApiBody({
    type: RefinePromptDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Prompt raffiné avec succès',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 503,
    description: 'Service Prompt Refiner non disponible',
  })
  async refinePrompt(@Body() dto: RefinePromptDto): Promise<RefinePromptResponse> {
    return this.iaFinetuningService.refinePrompt(dto);
  }

  // Product Generator Endpoints
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Générer une idée de produit via Product Generator',
    description:
      'Transforme un besoin utilisateur en idée produit structurée avec 6 sections (nom, problème, solution, cible, modèle économique, MVP).',
  })
  @ApiBody({
    type: GenerateProductDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Idée produit générée avec succès',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 503,
    description: 'Service Product Generator non disponible',
  })
  async generateProduct(@Body() dto: GenerateProductDto): Promise<GenerateProductResponse> {
    return this.iaFinetuningService.generateProduct(dto);
  }

  @Get('examples')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtenir des exemples de besoins pour tester',
    description: 'Retourne une liste d\'exemples de besoins utilisateurs pour tester le service Product Generator.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exemples récupérés avec succès',
    type: Object,
  })
  async getExamples(): Promise<ExamplesResponse> {
    return this.iaFinetuningService.getExamples();
  }

  // Health Check Endpoints
  @Get('health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Vérifier l\'état de santé des services IA',
    description: 'Retourne l\'état de santé des deux modèles (Prompt Refiner et Product Generator).',
  })
  @ApiResponse({
    status: 200,
    description: 'État de santé des services',
    type: Object,
  })
  async checkHealth(): Promise<HealthResponse> {
    return this.iaFinetuningService.checkHealth();
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Vérifier si le service est globalement healthy',
    description: 'Retourne un simple booléen indiquant si au moins un des modèles IA est disponible.',
  })
  @ApiResponse({
    status: 200,
    description: 'État du service',
    schema: {
      type: 'object',
      properties: {
        healthy: { type: 'boolean', description: 'Service healthy' },
        models: { type: 'array', items: { type: 'string' }, description: 'Modèles disponibles' },
      },
    },
  })
  async getStatus(): Promise<{ healthy: boolean; models: string[] }> {
    const [healthy, models] = await Promise.all([
      this.iaFinetuningService.isServiceHealthy(),
      this.iaFinetuningService.getAvailableModels(),
    ]);
    
    return { healthy, models };
  }
}

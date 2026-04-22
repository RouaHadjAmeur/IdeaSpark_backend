import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IAFinetuningService } from './ia-finetuning.service';
import {
  RefinePromptDto,
  RefinePromptResponse,
  GenerateProductDto,
  GenerateProductResponse,
  DecomposePromptDto,
  DecomposeResponse,
  SaveProductIdeaDto,
  HealthResponse,
  ExamplesResponse,
  SaveProductIdeaTraceDto,
  SavePromptRefinerTraceDto,
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

  // Prompt Decomposer Endpoints
  @Post('decompose')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Décomposer une idée en prompts spécialisés via Prompt Decomposer',
    description:
      'Envoie une idée de marque ou un besoin au FastAPI Prompt Decomposer (Mistral 7B GGUF) et renvoie trois prompts spécialisés (slogan, vidéo, produit).',
  })
  @ApiBody({
    type: DecomposePromptDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Idée décomposée avec succès',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 503,
    description: 'Service Prompt Decomposer non disponible',
  })
  async decomposePrompt(@Body() dto: DecomposePromptDto): Promise<DecomposeResponse> {
    return this.iaFinetuningService.decomposePrompt(dto);
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

  // Product Ideas CRUD Endpoints
  @Post('product-ideas/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sauvegarder une idée produit',
    description: 'Enregistre une idée produit générée dans la base de données.',
  })
  @ApiBody({
    type: SaveProductIdeaDto,
    description: 'Données de l\'idée produit à sauvegarder',
  })
  @ApiResponse({
    status: 201,
    description: 'Idée produit sauvegardée avec succès',
  })
  async saveProductIdea(@Body() dto: SaveProductIdeaDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user._id;
    return this.iaFinetuningService.saveProductIdea(dto, userId);
  }

  @Get('product-ideas/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer l\'historique des idées produits',
    description: 'Retourne toutes les idées produits générées par l\'utilisateur.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des idées produits',
  })
  async getProductIdeasHistory(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user._id;
    return this.iaFinetuningService.getProductIdeasHistory(userId);
  }

  @Get('product-ideas/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer les idées produits favorites',
    description: 'Retourne uniquement les idées produits marquées comme favorites.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des idées produits favorites',
  })
  async getProductIdeasFavorites(@Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user._id;
    return this.iaFinetuningService.getProductIdeasFavorites(userId);
  }

  @Post('product-ideas/toggle-favorite/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ajouter/Retirer une idée produit des favoris',
    description: 'Bascule le statut favorite d\'une idée produit.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut favorite mis à jour',
  })
  async toggleProductIdeaFavorite(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user._id;
    return this.iaFinetuningService.toggleProductIdeaFavorite(id, userId);
  }

  @Delete('product-ideas/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Supprimer une idée produit',
    description: 'Supprime définitivement une idée produit de l\'historique.',
  })
  @ApiResponse({
    status: 200,
    description: 'Idée produit supprimée',
  })
  async deleteProductIdea(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user._id;
    return this.iaFinetuningService.deleteProductIdea(id, userId);
  }

  // Traces Endpoints
  @Post('traces/product-idea')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enregistrer une trace d\'utilisation de Product Generator' })
  async saveProductIdeaTrace(@Body() dto: SaveProductIdeaTraceDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user._id;
    return this.iaFinetuningService.saveProductIdeaTrace(dto, userId);
  }

  @Post('traces/prompt-refiner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enregistrer une trace d\'utilisation de Prompt Refiner' })
  async savePromptRefinerTrace(@Body() dto: SavePromptRefinerTraceDto, @Req() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user._id;
    return this.iaFinetuningService.savePromptRefinerTrace(dto, userId);
  }

  @Get('traces/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les statistiques d\'utilisation des modèles (Web)' })
  async getTracesStats() {
    return this.iaFinetuningService.getTracesStats();
  }

  @Get('traces/product-idea')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les traces de Product Generator' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getProductIdeaTraces(@Query('query') query?: string, @Query('status') status?: string) {
    return this.iaFinetuningService.getProductIdeaTraces(query, status);
  }

  @Get('traces/prompt-refiner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les traces de Prompt Refiner' })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getPromptRefinerTraces(@Query('query') query?: string, @Query('status') status?: string) {
    return this.iaFinetuningService.getPromptRefinerTraces(query, status);
  }
}

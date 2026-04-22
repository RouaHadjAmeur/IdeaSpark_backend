import { HttpException, HttpStatus, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
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
  ProductSection,
  SaveProductIdeaTraceDto,
  SavePromptRefinerTraceDto,
} from './ia-finetuning.model';
import { ProductIdea, ProductIdeaDocument } from './schemas/product-idea.schema';
import { ProductIdeaTrace, ProductIdeaTraceDocument } from './schemas/product-idea-trace.schema';
import { PromptRefinerTrace, PromptRefinerTraceDocument } from './schemas/prompt-refiner-trace.schema';

@Injectable()
export class IAFinetuningService {
  private apiClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(ProductIdea.name) private productIdeaModel: Model<ProductIdeaDocument>,
    @InjectModel(ProductIdeaTrace.name) private productIdeaTraceModel: Model<ProductIdeaTraceDocument>,
    @InjectModel(PromptRefinerTrace.name) private promptRefinerTraceModel: Model<PromptRefinerTraceDocument>,
  ) {
    const baseURL = this.configService.get<string>('FINETUNING_API_URL');

    this.apiClient = axios.create({
      baseURL,
      timeout: 120000, // 2 minutes timeout for AI processing
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Prompt Refiner Methods
  async refinePrompt(dto: RefinePromptDto): Promise<RefinePromptResponse> {
    try {
      const response = await this.apiClient.post<{ result: string }>('/refiner/refine', {
        prompt: dto.prompt,
      });
      
      return {
        result: response.data.result,
        model_loaded: true
      };
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.detail || 'Erreur lors de l\'appel à Prompt Refiner API',
          error.response.status,
        );
      }
      throw new HttpException('Prompt Refiner API non joignable', HttpStatus.BAD_GATEWAY);
    }
  }

  // Product Generator Methods
  async generateProduct(dto: GenerateProductDto): Promise<GenerateProductResponse> {
    try {
      const response = await this.apiClient.post<GenerateProductResponse>('/generator/generate', {
        besoin: dto.besoin,
        temperature: dto.temperature,
        max_tokens: dto.max_tokens,
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.detail || 'Erreur lors de l\'appel à Product Generator API',
          error.response.status,
        );
      }
      throw new HttpException('Product Generator API non joignable', HttpStatus.BAD_GATEWAY);
    }
  }

  // Prompt Decomposer Methods
  async decomposePrompt(dto: DecomposePromptDto): Promise<DecomposeResponse> {
    try {
      const response = await this.apiClient.post<DecomposeResponse>('/decomposer/decompose', {
        idea: dto.idea,
        temperature: dto.temperature,
        max_tokens: dto.max_tokens,
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.detail || 'Erreur lors de l\'appel à Prompt Decomposer API',
          error.response.status,
        );
      }
      throw new HttpException('Prompt Decomposer API non joignable', HttpStatus.BAD_GATEWAY);
    }
  }

  async getExamples(): Promise<ExamplesResponse> {
    try {
      const response = await this.apiClient.get<ExamplesResponse>('/generator/examples');
      return response.data;
    } catch (error: any) {
      // Fallback vers exemples codés en dur si l'API n'est pas disponible
      return {
        examples: [
          "Les jeunes parents ont du mal à trouver du temps pour faire du sport.",
          "Les étudiants en informatique cherchent des projets pratiques pour leur portfolio.",
          "Les petites entreprises ont besoin d'outils de gestion abordables.",
          "Les personnes âgées veulent rester connectées avec leur famille.",
          "Les freelancers ont du mal à gérer leur temps et leurs factures."
        ]
      };
    }
  }

  // Health Check Methods
  async checkHealth(): Promise<HealthResponse> {
    try {
      const [rootHealth, healthCheck] = await Promise.allSettled([
        this.apiClient.get<any>('/'),
        this.apiClient.get<any>('/health')
      ]);

      const rootOk = rootHealth.status === 'fulfilled';
      const healthOk = healthCheck.status === 'fulfilled' && 
                       healthCheck.value.data.status === 'ok';

      // Extraire les informations depuis l'endpoint racine si disponible
      let promptRefinerLoaded = false;
      let productGeneratorLoaded = false;
      let promptDecomposerLoaded = false;

      if (rootOk && rootHealth.value.data.models_status) {
        promptRefinerLoaded = rootHealth.value.data.models_status.prompt_refiner === "OK";
        productGeneratorLoaded = rootHealth.value.data.models_status.product_generator === "OK";
        promptDecomposerLoaded = rootHealth.value.data.models_status.prompt_decomposer === "OK";
      } else if (healthOk) {
        // Utiliser l'endpoint /health comme fallback
        promptRefinerLoaded = healthCheck.value.data.prompt_refiner_loaded;
        productGeneratorLoaded = healthCheck.value.data.product_generator_loaded;
        promptDecomposerLoaded = healthCheck.value.data.prompt_decomposer_loaded;
      }

      return {
        status: (rootOk && healthOk) ? 'ok' : 'error',
        prompt_refiner_loaded: promptRefinerLoaded,
        product_generator_loaded: productGeneratorLoaded,
        prompt_decomposer_loaded: promptDecomposerLoaded,
        models_available: [
          ...(promptRefinerLoaded ? ['prompt-refiner'] : []),
          ...(productGeneratorLoaded ? ['product-generator'] : []),
          ...(promptDecomposerLoaded ? ['prompt-decomposer'] : [])
        ]
      };
    } catch (error: any) {
      return {
        status: 'error',
        prompt_refiner_loaded: false,
        product_generator_loaded: false,
        models_available: []
      };
    }
  }

  // Utility Methods
  async isServiceHealthy(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      return health.status === 'ok' && 
             (health.prompt_refiner_loaded || health.product_generator_loaded);
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const health = await this.checkHealth();
      return health.models_available || [];
    } catch {
      return [];
    }
  }

  // Product Ideas CRUD Methods
  async saveProductIdea(dto: SaveProductIdeaDto, userId: string): Promise<ProductIdea> {
    const newProductIdea = new this.productIdeaModel({
      ...dto,
      userId,
    });
    return newProductIdea.save();
  }

  async getProductIdeasHistory(userId: string): Promise<ProductIdea[]> {
    return this.productIdeaModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getProductIdeasFavorites(userId: string): Promise<ProductIdea[]> {
    return this.productIdeaModel.find({ userId, isFavorite: true }).sort({ createdAt: -1 }).exec();
  }

  async toggleProductIdeaFavorite(id: string, userId: string): Promise<ProductIdea> {
    const productIdea = await this.productIdeaModel.findOne({ _id: id, userId });
    if (!productIdea) {
      throw new NotFoundException('Product idea not found for this user');
    }
    productIdea.isFavorite = !productIdea.isFavorite;
    return productIdea.save();
  }

  async deleteProductIdea(id: string, userId: string): Promise<void> {
    const result = await this.productIdeaModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Product idea not found or not owned by user');
    }
  }

  // Traces Methods
  async saveProductIdeaTrace(dto: SaveProductIdeaTraceDto, userId: string): Promise<ProductIdeaTrace> {
    const newTrace = new this.productIdeaTraceModel({
      ...dto,
      userId,
    });
    return newTrace.save();
  }

  async savePromptRefinerTrace(dto: SavePromptRefinerTraceDto, userId: string): Promise<PromptRefinerTrace> {
    const newTrace = new this.promptRefinerTraceModel({
      ...dto,
      userId,
    });
    return newTrace.save();
  }

  async getProductIdeaTraces(query?: string, status?: string): Promise<ProductIdeaTrace[]> {
    const filter: any = {};
    if (query) {
      filter.$or = [
        { besoin: { $regex: query, $options: 'i' } },
        { rawOutput: { $regex: query, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }
    return this.productIdeaTraceModel.find(filter).sort({ createdAt: -1 }).limit(100).exec();
  }

  async getPromptRefinerTraces(query?: string, status?: string): Promise<PromptRefinerTrace[]> {
    const filter: any = {};
    if (query) {
      filter.$or = [
        { inputPrompt: { $regex: query, $options: 'i' } },
        { refinedResult: { $regex: query, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }
    return this.promptRefinerTraceModel.find(filter).sort({ createdAt: -1 }).limit(100).exec();
  }

  async getTracesStats(): Promise<any> {
    const [productIdeaCount, promptRefinerCount] = await Promise.all([
      this.productIdeaTraceModel.countDocuments().exec(),
      this.promptRefinerTraceModel.countDocuments().exec(),
    ]);

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const productIdeaHistory = await this.productIdeaTraceModel.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const promptRefinerHistory = await this.promptRefinerTraceModel.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    return {
      totalProductIdeas: productIdeaCount,
      totalPromptRefiners: promptRefinerCount,
      productIdeaHistory,
      promptRefinerHistory,
    };
  }
}

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  RefinePromptDto,
  RefinePromptResponse,
  GenerateProductDto,
  GenerateProductResponse,
  HealthResponse,
  ExamplesResponse,
  ProductSection,
} from './ia-finetuning.model';

@Injectable()
export class IAFinetuningService {
  private model1Client: AxiosInstance;
  private model2Client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const model1URL = this.configService.get<string>('MODEL1_URL') || 'http://20.199.16.13:8080';
    const model2URL = this.configService.get<string>('MODEL2_URL') || 'http://20.199.16.13:8081';

    this.model1Client = axios.create({
      baseURL: model1URL,
      timeout: 120000, // 2 minutes timeout for AI processing
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.model2Client = axios.create({
      baseURL: model2URL,
      timeout: 120000, // 2 minutes timeout for AI processing
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Prompt Refiner Methods
  async refinePrompt(dto: RefinePromptDto): Promise<RefinePromptResponse> {
    try {
      const response = await this.model1Client.post<{ result: string }>('/refiner/refine', {
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
      const response = await this.model2Client.post<GenerateProductResponse>('/generator/generate', {
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

  async getExamples(): Promise<ExamplesResponse> {
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

  // Health Check Methods
  async checkHealth(): Promise<HealthResponse> {
    const [unifiedHealth, generatorHealth] = await Promise.allSettled([
      this.model1Client.get<any>('/'),
      this.model2Client.get<any>('/generator/health'),
    ]);

    const unifiedOk = unifiedHealth.status === 'fulfilled';
    const generatorOk =
      generatorHealth.status === 'fulfilled' &&
      generatorHealth.value.data.status === 'ok';

    return {
      status: unifiedOk && generatorOk ? 'ok' : 'error',
      prompt_refiner_loaded: unifiedOk,
      product_generator_loaded: generatorOk,
      models_available: [
        ...(unifiedOk ? ['prompt-refiner'] : []),
        ...(generatorOk ? ['product-generator'] : []),
      ],
    };
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
}

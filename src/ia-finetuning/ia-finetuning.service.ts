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
} from './ia-finetuning.model';

@Injectable()
export class IAFinetuningService {
  private client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL =
      this.configService.get<string>('IA_FINETUNING_API_URL') || 'http://localhost:8000';

    this.client = axios.create({
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
      const response = await this.client.post<RefinePromptResponse>('/refine', {
        prompt: dto.prompt,
      });
      return response.data;
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
      const response = await this.client.post<GenerateProductResponse>('/generate', {
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
    try {
      const response = await this.client.get<ExamplesResponse>('/examples');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.detail || 'Erreur lors de la récupération des exemples',
          error.response.status,
        );
      }
      throw new HttpException('Impossible de récupérer les exemples', HttpStatus.BAD_GATEWAY);
    }
  }

  // Health Check Methods
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data?.detail || 'Erreur lors de la vérification de santé',
          error.response.status,
        );
      }
      throw new HttpException('API IA Finetuning non joignable', HttpStatus.BAD_GATEWAY);
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
}

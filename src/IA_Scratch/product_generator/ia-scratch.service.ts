import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  GenerateProductIdeaDto,
  GenerateProductResponse,
  HealthResponse,
} from './ia-scratch.model';

@Injectable()
export class IAScratchService {
  private client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL =
      this.configService.get<string>('PRODUCT_GENERATOR_API_URL') ||
      'http://localhost:8000';

    this.client = axios.create({
      baseURL,
      timeout: 120000,
    });
  }

  async generateIdea(
    dto: GenerateProductIdeaDto,
  ): Promise<GenerateProductResponse> {
    try {
      const response = await this.client.post<GenerateProductResponse>(
        '/generate',
        {
          besoin: dto.besoin,
          temperature: dto.temperature ?? 0.7,
          max_tokens: dto.maxTokens ?? 700,
        },
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data ||
            'Erreur lors de l’appel à Product Generator API',
          error.response.status,
        );
      }
      throw new HttpException(
        'Product Generator API non joignable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.data;
    } catch {
      throw new HttpException(
        'Product Generator API non joignable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

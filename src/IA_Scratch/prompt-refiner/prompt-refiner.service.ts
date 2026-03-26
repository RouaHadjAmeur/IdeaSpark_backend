import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { RefinePromptDto, RefinePromptResponse } from './prompt-refiner.model';

@Injectable()
export class PromptRefinerService {
  private client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL =
      this.configService.get<string>('PROMPT_REFINER_API_URL') || 'http://localhost:8000';

    this.client = axios.create({
      baseURL,
      timeout: 60000,
    });
  }

  async refinePrompt(dto: RefinePromptDto): Promise<RefinePromptResponse> {
    try {
      const response = await this.client.post<RefinePromptResponse>('/refine', {
        prompt: dto.prompt,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(
          error.response.data || 'Erreur lors de l’appel à Prompt Refiner API',
          error.response.status,
        );
      }
      throw new HttpException('Prompt Refiner API non joignable', HttpStatus.BAD_GATEWAY);
    }
  }
}


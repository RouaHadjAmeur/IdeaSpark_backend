import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

// Prompt Refiner DTO
export class RefinePromptDto {
  @ApiProperty({
    description: 'Prompt brut à raffiner',
    example: 'Crée un plan de contenu Instagram pour une marque de vêtements éco-responsables.',
    minLength: 1,
    maxLength: 4000,
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export interface RefinePromptResponse {
  result: string;
  model_loaded: boolean;
}

// Product Generator DTO
export class GenerateProductDto {
  @ApiProperty({
    description: 'Besoin utilisateur à transformer en idée produit',
    example: 'Les jeunes parents ont du mal à trouver du temps pour faire du sport.',
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  besoin: string;

  @ApiProperty({
    description: 'Créativité du modèle (0.1 = conservateur, 1.5 = très créatif)',
    example: 0.7,
    minimum: 0.1,
    maximum: 1.5,
    default: 0.7,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  @Max(1.5)
  temperature?: number = 0.7;

  @ApiProperty({
    description: 'Nombre maximum de tokens générés',
    example: 700,
    minimum: 200,
    maximum: 1500,
    default: 700,
  })
  @IsNumber()
  @IsOptional()
  @Min(200)
  @Max(1500)
  max_tokens?: number = 700;
}

export interface ProductSection {
  nom_du_produit: string;
  probleme: string;
  solution: string;
  cible: string;
  modele_economique: string;
  mvp: string;
}

export interface GenerateProductResponse {
  besoin: string;
  produit: ProductSection;
  raw_output: string;
  duration_seconds: number;
  model_loaded: boolean;
}

// Health Check DTO
export interface HealthResponse {
  status: string;
  prompt_refiner_loaded: boolean;
  product_generator_loaded: boolean;
  models_available: string[];
}

// Examples DTO
export interface ExamplesResponse {
  examples: string[];
}

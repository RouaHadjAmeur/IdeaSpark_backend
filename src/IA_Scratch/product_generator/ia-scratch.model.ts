import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GenerateProductIdeaDto {
  @ApiProperty({
    description: 'Besoin utilisateur à transformer en idée produit vendable',
    example:
      'Les jeunes parents ont du mal à trouver du temps pour faire du sport.',
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  besoin: string;

  @ApiProperty({
    description:
      'Créativité du modèle FastAPI (0.1 = conservateur, 1.5 = très créatif)',
    example: 0.7,
    minimum: 0.1,
    maximum: 1.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.5)
  temperature?: number;

  @ApiProperty({
    description: 'Nombre maximum de tokens générés par le modèle FastAPI',
    example: 700,
    minimum: 200,
    maximum: 1500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(200)
  @Max(1500)
  maxTokens?: number;
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

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_path?: string;
}

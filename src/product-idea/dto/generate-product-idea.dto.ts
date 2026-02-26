import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class GenerateProductIdeaDto {
  @ApiProperty({
    description: 'Le besoin ou problème à résoudre',
    example: 'Je perds toujours mes clés de voiture',
  })
  @IsString()
  @IsNotEmpty()
  painPoint: string;

  @ApiProperty({
    description: 'Public cible (optionnel)',
    example: 'Professionnels urbains, 25-45 ans',
    required: false,
  })
  @IsString()
  @IsOptional()
  targetAudience?: string;

  @ApiProperty({
    description: 'Budget maximum souhaité (optionnel)',
    example: 50,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10000)
  maxBudget?: number;

  @ApiProperty({
    description: 'Catégorie de produit (optionnel)',
    example: 'Technologie, Accessoire, Service',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;
}

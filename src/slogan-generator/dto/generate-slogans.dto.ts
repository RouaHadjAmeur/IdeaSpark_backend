import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSlogansDto {
  @ApiProperty({
    description: 'Nom de la marque ou du produit',
    example: 'EcoTech Solutions',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la marque est requis' })
  @MinLength(2, { message: 'Le nom de la marque doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom de la marque ne peut pas dépasser 100 caractères' })
  brandName: string;

  @ApiProperty({
    description: 'Description du produit ou service',
    example: 'Solutions technologiques écologiques pour entreprises',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

  @ApiProperty({
    description: 'Secteur d\'activité',
    example: 'Technologie verte',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Le secteur ne peut pas dépasser 100 caractères' })
  industry?: string;

  @ApiProperty({
    description: 'Secteur (alias possible de "industry")',
    example: 'Technologie verte',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Le secteur ne peut pas dépasser 100 caractères' })
  sector?: string;

  @ApiProperty({
    description: 'Valeurs de la marque (ex: "innovation, performance")',
    example: 'innovation, performance',
    required: false,
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'brandValues ne peut pas dépasser 300 caractères' })
  brandValues?: string;

  @ApiProperty({
    description: 'Ton souhaité pour les slogans (ex: Inspirant, Sérieux)',
    example: 'Inspirant',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Le ton ne peut pas dépasser 100 caractères' })
  tone?: string;

  @ApiProperty({
    description: 'Public cible',
    example: 'Entreprises soucieuses de l\'environnement',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Le public cible ne peut pas dépasser 200 caractères' })
  targetAudience?: string;

  @ApiProperty({
    description: 'Langue souhaitée pour les slogans (fr, en, es, etc.)',
    example: 'fr',
    default: 'fr',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: 'Prompt professionnel pré-construit par le frontend (formulaire de copywriting avec 12 champs)',
    example: 'Tu es un expert en conception-rédaction...',
    required: false,
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Le prompt ne peut pas dépasser 5000 caractères' })
  copywritingPrompt?: string;
}

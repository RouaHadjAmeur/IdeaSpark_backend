import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Max, Min } from 'class-validator';

export class SloganDto {
  @ApiProperty({
    description: 'Le slogan généré',
    example: 'L\'innovation verte au service de votre entreprise',
  })
  @IsString()
  slogan: string;

  @ApiProperty({
    description: 'Explication du slogan et de son positionnement',
    example: 'Ce slogan met en avant l\'aspect innovant et écologique de la marque tout en soulignant son orientation B2B.',
  })
  @IsString()
  explanation: string;

  @ApiProperty({
    description: 'Score de mémorabilité (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  memorabilityScore: number;

  @ApiProperty({
    description: 'Catégorie du slogan',
    example: 'Innovation',
    enum: ['Innovation', 'Émotion', 'Bénéfice', 'Aspiration', 'Descriptif', 'Provocateur', 'Humoristique'],
  })
  @IsString()
  category: string;
}

export class GenerateSlogansResponseDto {
  @ApiProperty({
    description: 'Liste des slogans générés',
    type: [SloganDto],
    minItems: 10,
  })
  slogans: SloganDto[];

  @ApiProperty({
    description: 'Nom de la marque utilisé',
    example: 'EcoTech Solutions',
  })
  brandName: string;

  @ApiProperty({
    description: 'Langue des slogans',
    example: 'fr',
  })
  language: string;

  @ApiProperty({
    description: 'Timestamp de génération',
    example: '2026-02-09T20:10:00.000Z',
  })
  generatedAt: Date;
}

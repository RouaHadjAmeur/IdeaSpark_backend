import { ApiProperty } from '@nestjs/swagger';

export class ProductFeatureDto {
  @ApiProperty({ description: 'Nom de la fonctionnalité' })
  name: string;

  @ApiProperty({ description: 'Description de la fonctionnalité' })
  description: string;

  @ApiProperty({ description: 'Priorité (Essentielle, Importante, Bonus)' })
  priority: string;
}

export class MarketAnalysisDto {
  @ApiProperty({ description: 'Score de potentiel marché (0-100)' })
  marketScore: number;

  @ApiProperty({ description: 'Taille du marché estimée' })
  marketSize: string;

  @ApiProperty({ description: 'Niveau de concurrence' })
  competitionLevel: string;

  @ApiProperty({ description: 'Tendance du marché' })
  marketTrend: string;

  @ApiProperty({ description: 'Principaux concurrents', type: [String] })
  competitors: string[];
}

export class PricingDto {
  @ApiProperty({ description: 'Prix suggéré minimum' })
  minPrice: number;

  @ApiProperty({ description: 'Prix suggéré optimal' })
  optimalPrice: number;

  @ApiProperty({ description: 'Prix suggéré maximum' })
  maxPrice: number;

  @ApiProperty({ description: 'Justification du prix' })
  priceJustification: string;
}

export class ProductIdeaDto {
  @ApiProperty({ description: 'Nom du produit' })
  productName: string;

  @ApiProperty({ description: 'Description courte du produit' })
  shortDescription: string;

  @ApiProperty({ description: 'Description détaillée du produit' })
  detailedDescription: string;

  @ApiProperty({ description: 'Pain point identifié' })
  painPoint: string;

  @ApiProperty({ description: 'Solution proposée' })
  solution: string;

  @ApiProperty({ description: 'Liste des fonctionnalités', type: [ProductFeatureDto] })
  features: ProductFeatureDto[];

  @ApiProperty({ description: 'Analyse de marché', type: MarketAnalysisDto })
  marketAnalysis: MarketAnalysisDto;

  @ApiProperty({ description: 'Stratégie de prix', type: PricingDto })
  pricing: PricingDto;

  @ApiProperty({ description: 'Public cible' })
  targetAudience: string;

  @ApiProperty({ description: 'Proposition de valeur unique' })
  uniqueValueProposition: string;

  @ApiProperty({ description: 'Prochaines étapes recommandées', type: [String] })
  nextSteps: string[];
}

export class GenerateProductIdeaResponseDto {
  @ApiProperty({ description: 'Idée de produit générée', type: ProductIdeaDto })
  productIdea: ProductIdeaDto;

  @ApiProperty({ description: 'Date de génération' })
  generatedAt: Date;
}

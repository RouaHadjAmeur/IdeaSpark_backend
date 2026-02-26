import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { GenerateProductIdeaDto } from './dto/generate-product-idea.dto';
import { GenerateProductIdeaResponseDto, ProductIdeaDto } from './dto/product-idea-response.dto';
import { ProductIdea, ProductIdeaDocument } from './schemas/product-idea.schema';

@Injectable()
export class ProductIdeaService {
  private genAI: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    @InjectModel(ProductIdea.name) private productIdeaModel: Model<ProductIdeaDocument>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    const hasKey = !!apiKey && apiKey !== 'your-gemini-api-key-here';
    console.log(`[Product Idea Service] GEMINI_API_KEY present: ${hasKey ? 'yes' : 'no'}`);
    if (!hasKey) {
      console.warn('[Product Idea Service] Gemini API key not configured. Product idea generation will not work.');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generateProductIdea(dto: GenerateProductIdeaDto): Promise<GenerateProductIdeaResponseDto> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new BadRequestException(
        'Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.',
      );
    }

    const optimizedPrompt = this.buildOptimizedPrompt(dto);

    try {
      const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
      
      console.log(`[Product Idea Service] Using model: ${modelName}`);
      const startTime = Date.now();

      // Configuration optimisée pour réduire le temps de génération
      const result = await this.genAI.models.generateContent({
        model: modelName,
        contents: [{ 
          role: 'user', 
          parts: [{ text: optimizedPrompt }] 
        }],
        config: {
          temperature: 0.7,        // Réduit de 0.85 à 0.7
          maxOutputTokens: 2000,   // Augmenté à 2000 pour éviter la troncature
          topP: 0.8,
          topK: 40,
        },
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`[Product Idea Service] Generation completed in ${duration}s`);

      const content = result.text;

      if (!content) {
        throw new Error('No response from Gemini');
      }

      // Nettoyer la réponse si elle contient des backticks markdown
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Nettoyer les virgules en trop avant les accolades fermantes
      cleanContent = cleanContent.replace(/,(\s*[}\]])/g, '$1');

      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('[Product Idea Service] Failed to parse JSON response:', cleanContent);
        throw new BadRequestException(
          'The AI model returned an invalid response. Please try again.',
        );
      }

      const productIdea = this.parseProductIdea(parsedResponse);

      return {
        productIdea,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('[Product Idea Service] Error generating product idea:', {
        message: error?.message,
        status: error?.status,
        type: error?.type,
      });

      if (error?.message && error.message.includes('429')) {
        const retryMatch = error.message.match(/retry in (\d+(?:\.\d+)?)/i);
        const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 15;
        throw new BadRequestException(
          `Rate limit exceeded. Please wait ${retrySeconds} seconds and try again.`,
        );
      }

      if (error?.status === 404) {
        throw new BadRequestException(
          'Gemini model not found. Please check your API key permissions.',
        );
      }

      const baseMsg = error?.message || 'Failed to generate product idea';
      throw new BadRequestException(`Failed to generate product idea: ${baseMsg}`);
    }
  }

  async generateProductIdeaDemo(dto: GenerateProductIdeaDto): Promise<GenerateProductIdeaResponseDto> {
    // Simuler un délai de 2 secondes pour rendre réaliste
    await new Promise(resolve => setTimeout(resolve, 2000));

    const productIdea: ProductIdeaDto = {
      productName: 'SmartKey Finder Pro',
      shortDescription: 'Traceur Bluetooth ultra-compact avec batterie remplaçable pour ne plus jamais perdre vos clés',
      detailedDescription: `SmartKey Finder Pro est un dispositif de localisation Bluetooth de nouvelle génération conçu pour les professionnels urbains actifs. Avec son design ultra-compact de seulement 3mm d'épaisseur, il se glisse facilement sur votre trousseau sans ajouter de volume. L'application mobile intuitive vous permet de localiser vos clés en temps réel avec une portée de 50m en intérieur et 100m en extérieur. La sonnerie puissante de 90dB vous aide à retrouver vos clés même dans les endroits bruyants.`,
      painPoint: dto.painPoint,
      solution: 'Un traceur Bluetooth intelligent avec application mobile qui vous permet de localiser vos clés instantanément, avec sonnerie forte et notifications de proximité',
      features: [
        {
          name: 'Localisation Bluetooth 5.0',
          description: 'Portée de 50m en intérieur, 100m en extérieur avec connexion stable',
          priority: 'Essentielle',
        },
        {
          name: 'Sonnerie forte 90dB',
          description: 'Son puissant pour retrouver facilement vos clés même dans le bruit',
          priority: 'Essentielle',
        },
        {
          name: 'Batterie remplaçable',
          description: '12 mois d\'autonomie avec pile CR2032 standard',
          priority: 'Importante',
        },
        {
          name: 'Design ultra-compact',
          description: 'Seulement 3mm d\'épaisseur, le plus fin du marché',
          priority: 'Importante',
        },
        {
          name: 'Résistant à l\'eau IP67',
          description: 'Protection contre l\'eau et la poussière',
          priority: 'Bonus',
        },
        {
          name: 'Mode communautaire',
          description: 'Localisation via le réseau d\'utilisateurs si hors de portée',
          priority: 'Bonus',
        },
      ],
      marketAnalysis: {
        marketScore: 82,
        marketSize: '2.5 milliards € en Europe, 8 milliards $ au niveau mondial',
        competitionLevel: 'Élevé',
        marketTrend: 'Croissance',
        competitors: ['Apple AirTag', 'Tile Pro', 'Samsung SmartTag', 'Chipolo ONE'],
      },
      pricing: {
        minPrice: 15,
        optimalPrice: dto.maxBudget ? Math.min(29, dto.maxBudget) : 29,
        maxPrice: 45,
        priceJustification: `Prix compétitif face aux leaders du marché (AirTag à 35€, Tile à 30€). Le prix optimal de ${dto.maxBudget ? Math.min(29, dto.maxBudget) : 29}€ permet une marge confortable de 65% tout en restant attractif. Pack de 4 unités à 99€ pour augmenter le panier moyen. Positionnement premium justifié par la batterie remplaçable et le design ultra-compact.`,
      },
      targetAudience: dto.targetAudience || 'Professionnels urbains actifs, 25-55 ans, utilisant quotidiennement leur voiture, sensibles à la technologie et prêts à investir dans des solutions pratiques',
      uniqueValueProposition: 'Le seul traceur avec batterie remplaçable ET design ultra-compact (3mm). Compatible Android et iOS sans abonnement, contrairement à AirTag qui nécessite un iPhone.',
      nextSteps: [
        'Créer un prototype fonctionnel avec Bluetooth 5.0 et tester la portée réelle',
        'Réaliser des tests utilisateurs auprès de 50 professionnels urbains pendant 2 semaines',
        'Développer l\'application mobile iOS/Android avec interface intuitive',
        'Négocier avec fabricants en Chine pour production à 8€/unité (MOQ 5000)',
        'Lancer une campagne Kickstarter avec objectif 50K€ et early bird à 19€',
        'Créer des partenariats avec concessionnaires automobiles pour distribution',
      ],
    };

    return {
      productIdea,
      generatedAt: new Date(),
    };
  }

  private buildOptimizedPrompt(dto: GenerateProductIdeaDto): string {
    const { painPoint, targetAudience, maxBudget, category } = dto;
    
    return `Génère UNE SEULE idée de produit concise pour: ${painPoint}

${category ? `Catégorie: ${category}` : ''} ${maxBudget ? `| Budget max: ${maxBudget}€` : ''}

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide et CONCIS (pas de markdown, pas de texte avant/après):
{
  "productName": "Nom court",
  "shortDescription": "Max 15 mots",
  "detailedDescription": "Max 30 mots",
  "painPoint": "${painPoint}",
  "solution": "Max 20 mots",
  "targetAudience": "${targetAudience || 'Grand public'}",
  "features": [
    {"name": "Feature 1", "description": "Max 10 mots", "priority": "Essentielle"},
    {"name": "Feature 2", "description": "Max 10 mots", "priority": "Importante"},
    {"name": "Feature 3", "description": "Max 10 mots", "priority": "Bonus"}
  ],
  "marketAnalysis": {
    "marketScore": 75,
    "marketSize": "Max 15 mots",
    "competitionLevel": "Moyen",
    "marketTrend": "Croissance",
    "competitors": ["Nom1", "Nom2", "Nom3"]
  },
  "pricing": {
    "minPrice": ${maxBudget ? Math.floor(maxBudget * 0.5) : 20},
    "optimalPrice": ${maxBudget || 50},
    "maxPrice": ${maxBudget ? Math.floor(maxBudget * 1.5) : 100},
    "priceJustification": "Max 20 mots"
  },
  "uniqueValueProposition": "Max 20 mots",
  "nextSteps": ["Étape courte 1", "Étape courte 2", "Étape courte 3"]
}

RÈGLES STRICTES:
- 3-5 features MAX
- 3-4 concurrents MAX  
- 3-5 nextSteps MAX
- Descriptions COURTES
- JSON valide uniquement`;
  }

  private getSystemPrompt(): string {
    return `Tu es un expert en innovation produit, analyse de marché et stratégie commerciale. 
Tu transformes des besoins ou problèmes en idées de produits vendables et viables.

Pour chaque demande, tu dois fournir:
1. Un nom de produit accrocheur et mémorable
2. Une description claire et convaincante
3. Le pain point clairement identifié et analysé
4. La solution proposée avec sa valeur ajoutée
5. Une liste de fonctionnalités priorisées (Essentielle, Importante, Bonus)
6. Une analyse de marché complète avec:
   - Score de potentiel marché (0-100)
   - Taille du marché estimée
   - Niveau de concurrence (Faible, Moyen, Élevé)
   - Tendance du marché (Croissance, Stable, Déclin)
   - Liste des principaux concurrents
7. Une stratégie de prix cohérente avec:
   - Prix minimum, optimal et maximum
   - Justification détaillée du prix
8. Le public cible précis
9. La proposition de valeur unique (UVP)
10. Les prochaines étapes recommandées pour lancer le produit

Réponds UNIQUEMENT avec un objet JSON valide dans ce format exact:
{
  "productName": "Nom du produit",
  "shortDescription": "Description courte",
  "detailedDescription": "Description détaillée",
  "painPoint": "Pain point identifié",
  "solution": "Solution proposée",
  "features": [
    {
      "name": "Nom de la fonctionnalité",
      "description": "Description",
      "priority": "Essentielle"
    }
  ],
  "marketAnalysis": {
    "marketScore": 85,
    "marketSize": "500M€ en Europe",
    "competitionLevel": "Moyen",
    "marketTrend": "Croissance",
    "competitors": ["Concurrent 1", "Concurrent 2"]
  },
  "pricing": {
    "minPrice": 20,
    "optimalPrice": 35,
    "maxPrice": 50,
    "priceJustification": "Justification détaillée"
  },
  "targetAudience": "Public cible précis",
  "uniqueValueProposition": "Ce qui rend ce produit unique",
  "nextSteps": ["Étape 1", "Étape 2", "Étape 3"]
}`;
  }

  private buildPrompt(dto: GenerateProductIdeaDto): string {
    let prompt = `Génère une idée de produit vendable basée sur ce besoin:\n\n`;
    prompt += `Pain Point: ${dto.painPoint}\n`;

    if (dto.targetAudience) {
      prompt += `Public cible: ${dto.targetAudience}\n`;
    }

    if (dto.maxBudget) {
      prompt += `Budget maximum: ${dto.maxBudget}€\n`;
      prompt += `IMPORTANT: Le prix optimal doit être inférieur ou égal à ${dto.maxBudget}€\n`;
    }

    if (dto.category) {
      prompt += `Catégorie souhaitée: ${dto.category}\n`;
    }

    prompt += `\nCrée un produit innovant, viable commercialement, avec une analyse de marché réaliste.`;
    prompt += `\nLes fonctionnalités doivent être concrètes et réalisables.`;
    prompt += `\nLe score de marché doit refléter le potentiel réel du produit.`;

    return prompt;
  }

  private parseProductIdea(response: any): ProductIdeaDto {
    if (!response.productName || !response.features || !response.marketAnalysis || !response.pricing) {
      console.error('[Product Idea Service] Invalid response structure:', JSON.stringify(response, null, 2));
      throw new Error('Invalid response format from Gemini');
    }

    return {
      productName: response.productName || '',
      shortDescription: response.shortDescription || '',
      detailedDescription: response.detailedDescription || '',
      painPoint: response.painPoint || '',
      solution: response.solution || '',
      features: response.features || [],
      marketAnalysis: {
        marketScore: Math.min(100, Math.max(0, response.marketAnalysis?.marketScore || 0)),
        marketSize: response.marketAnalysis?.marketSize || '',
        competitionLevel: response.marketAnalysis?.competitionLevel || '',
        marketTrend: response.marketAnalysis?.marketTrend || '',
        competitors: response.marketAnalysis?.competitors || [],
      },
      pricing: {
        minPrice: response.pricing?.minPrice || 0,
        optimalPrice: response.pricing?.optimalPrice || 0,
        maxPrice: response.pricing?.maxPrice || 0,
        priceJustification: response.pricing?.priceJustification || '',
      },
      targetAudience: response.targetAudience || '',
      uniqueValueProposition: response.uniqueValueProposition || '',
      nextSteps: response.nextSteps || [],
    };
  }

  async saveProductIdea(productIdea: ProductIdeaDto, userId: string): Promise<ProductIdea> {
    const newProductIdea = new this.productIdeaModel({
      ...productIdea,
      userId,
    });
    return newProductIdea.save();
  }

  async getHistory(userId: string): Promise<ProductIdea[]> {
    return this.productIdeaModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getFavorites(userId: string): Promise<ProductIdea[]> {
    return this.productIdeaModel.find({ userId, isFavorite: true }).sort({ createdAt: -1 }).exec();
  }

  async toggleFavorite(id: string, userId: string): Promise<ProductIdea> {
    const productIdea = await this.productIdeaModel.findOne({ _id: id, userId });
    if (!productIdea) {
      throw new NotFoundException('Product idea not found for this user');
    }
    productIdea.isFavorite = !productIdea.isFavorite;
    return productIdea.save();
  }

  async deleteProductIdea(id: string, userId: string): Promise<void> {
    const result = await this.productIdeaModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Product idea not found or not owned by user');
    }
  }
}

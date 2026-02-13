import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { GenerateSlogansDto } from './dto/generate-slogans.dto';
import { GenerateSlogansResponseDto, SloganDto } from './dto/slogan-response.dto';
import { Slogan, SloganDocument } from './schemas/slogan.schema';

@Injectable()
export class SloganAiService {
  private genAI: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    @InjectModel(Slogan.name) private sloganModel: Model<SloganDocument>,
  ) {
    const apiKeyFromConfig = this.configService.get<string>('GEMINI_API_KEY');
    const apiKey = apiKeyFromConfig || process.env.GEMINI_API_KEY || '';
    const hasKey = !!apiKey && apiKey !== 'your-gemini-api-key-here';
    console.log(`[AI Service] GEMINI_API_KEY present: ${hasKey ? 'yes' : 'no'}`);
    if (!hasKey) {
      console.warn('[AI Service] Gemini API key not configured. AI features will not work.');
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generateSlogans(dto: GenerateSlogansDto): Promise<GenerateSlogansResponseDto> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new BadRequestException(
        'Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.',
      );
    }

    const language = dto.language || 'fr';
    const languageNames: Record<string, string> = {
      fr: 'français',
      en: 'English',
      es: 'español',
      de: 'Deutsch',
      it: 'italiano',
      pt: 'português',
      ar: 'العربية',
      zh: '中文',
    };
    const languageName = languageNames[language] || language;

    // Utiliser le prompt professionnel du frontend s'il existe, sinon construire le prompt standard
    let fullPrompt: string;

    if (dto.copywritingPrompt) {
      // Utiliser le prompt professionnel envoyé par le frontend, mais ajouter le system prompt
      const systemPrompt = this.getSystemPrompt(language);
      fullPrompt = `${systemPrompt}\n\n${dto.copywritingPrompt}`;
    } else {
      // Fallback : prompt simple pour compatibilité avec l'ancien formulaire
      const systemPrompt = this.getSystemPrompt(language);
      const userPrompt = this.buildPrompt(dto, language, languageName);
      fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    }

    try {
      const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';

      const result = await this.genAI.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: {
          temperature: 0.95,
          maxOutputTokens: 8000,
          responseMimeType: 'application/json',
        },
      });

      const content = result.text;

      if (!content) {
        throw new Error('No response from Gemini');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch (parseError) {
        console.error('[AI Service] Failed to parse JSON response:', content);
        throw new BadRequestException(
          'The AI model returned an invalid response. Please try again.',
        );
      }

      const slogans = this.parseSlogans(parsedResponse);

      // Ensure we have at least 10 slogans
      if (slogans.length < 10) {
        throw new Error('Not enough slogans generated');
      }

      return {
        slogans: slogans.slice(0, 10), // Take only first 10
        brandName: dto.brandName,
        language,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      // Handle rate limiting errors specifically
      if (error?.message && error.message.includes('429')) {
        const retryMatch = error.message.match(/retry in (\d+(?:\.\d+)?)/i);
        const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 15;
        console.error('[AI Service] Rate limit exceeded. Retry in:', retrySeconds, 'seconds');
        throw new BadRequestException(
          `Rate limit exceeded. The free tier allows 5 requests per minute for gemini-2.5-flash. Please wait ${retrySeconds} seconds and try again.`,
        );
      }

      // If the error is a 404 from the Generative AI API
      if (error?.status === 404) {
        console.error('[AI Service] Model endpoint returned 404.');
        throw new BadRequestException(
          `Failed to generate slogans: model not found (404).`,
        );
      }

      console.error('[AI Service] Error generating slogans:', {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        errorDetails: error?.errorDetails,
        stack: error?.stack,
      });

      const baseMsg = error?.message || 'Failed to generate slogans';
      if (error?.status || error?.statusText) {
        throw new BadRequestException(
          `Failed to generate slogans: ${baseMsg} (status: ${error?.status || 'N/A'} ${error?.statusText || ''})`,
        );
      }

      throw new BadRequestException(`Failed to generate slogans: ${baseMsg}`);
    }
  }

  private getSystemPrompt(language: string): string {
    const prompts: Record<string, string> = {
      fr: `Tu es un expert en marketing et en création de slogans publicitaires. Tu génères des slogans créatifs, mémorables et percutants pour les marques. Tu fournis toujours exactement 10 slogans DIFFÉRENTS avec leurs explications et scores de mémorabilité. IMPORTANT: Tous les slogans doivent être en français.`,
      en: `You are an expert in marketing and advertising slogan creation. You generate creative, memorable, and impactful slogans for brands. You always provide exactly 10 DIFFERENT slogans with their explanations and memorability scores. IMPORTANT: All slogans must be in English.`,
      es: `Eres un experto en marketing y creación de eslóganes publicitarios. Generas eslóganes creativos, memorables e impactantes para las marcas. Siempre proporcionas exactamente 10 eslóganes DIFERENTES con sus explicaciones y puntuaciones de memorabilidad. IMPORTANTE: Todos los eslóganes deben estar en español.`,
      de: `Du bist ein Experte für Marketing und Werbeslogans. Du generierst kreative, einprägsame und wirkungsvolle Slogans für Marken. Du lieferst immer genau 10 VERSCHIEDENE Slogans mit ihren Erklärungen und Einprägsamkeitswerten. WICHTIG: Alle Slogans müssen auf Deutsch sein.`,
      it: `Sei un esperto di marketing e creazione di slogan pubblicitari. Generi slogan creativi, memorabili e d'impatto per i marchi. Fornisci sempre esattamente 10 slogan DIVERSI con le loro spiegazioni e punteggi di memorabilità. IMPORTANTE: Tutti gli slogan devono essere in italiano.`,
      pt: `Você é um especialista em marketing e criação de slogans publicitários. Você gera slogans criativos, memoráveis e impactantes para marcas. Você sempre fornece exatamente 10 slogans DIFERENTES com suas explicações e pontuações de memorabilidade. IMPORTANTE: Todos os slogans devem estar em português.`,
    };
    return prompts[language] || prompts['en'];
  }

  private buildPrompt(dto: GenerateSlogansDto, language: string, languageName: string): string {
    const templates: Record<string, any> = {
      fr: {
        intro: `Génère exactement 10 slogans DIFFÉRENTS, créatifs et mémorables en ${languageName} pour la marque "${dto.brandName}".`,
        description: 'Description',
        industry: 'Secteur',
        target: 'Public cible',
        instructions: `\n\nIMPORTANT: Tous les slogans doivent être DIFFÉRENTS les uns des autres et en ${languageName}.\n\nPour chaque slogan, fournis:
1. Le slogan lui-même (court, percutant, mémorable, UNIQUE)
2. Une explication détaillée du positionnement et de la stratégie
3. Un score de mémorabilité de 0 à 100
4. Une catégorie parmi: Innovation, Émotion, Bénéfice, Aspiration, Descriptif, Provocateur, Humoristique

Réponds UNIQUEMENT avec un objet JSON valide dans ce format:
{
  "slogans": [
    {
      "slogan": "Le slogan ici",
      "explanation": "Explication détaillée ici",
      "memorabilityScore": 85,
      "category": "Innovation"
    }
  ]
}

Génère 10 slogans VARIÉS et CRÉATIFS.`,
      },
      en: {
        intro: `Generate exactly 10 DIFFERENT, creative and memorable slogans in ${languageName} for the brand "${dto.brandName}".`,
        description: 'Description',
        industry: 'Industry',
        target: 'Target Audience',
        instructions: `\n\nIMPORTANT: All slogans must be DIFFERENT from each other and in ${languageName}.\n\nFor each slogan, provide:
1. The slogan itself (short, impactful, memorable, UNIQUE)
2. A detailed explanation of the positioning and strategy
3. A memorability score from 0 to 100
4. A category among: Innovation, Emotion, Benefit, Aspiration, Descriptive, Provocative, Humorous

Respond ONLY with a valid JSON object in this exact format:
{
  "slogans": [
    {
      "slogan": "The slogan here",
      "explanation": "Detailed explanation here",
      "memorabilityScore": 85,
      "category": "Innovation"
    }
  ]
}

Generate 10 VARIED and CREATIVE slogans.`,
      },
      de: {
        intro: `Generiere genau 10 VERSCHIEDENE, kreative und einprägsame Slogans auf ${languageName} für die Marke "${dto.brandName}".`,
        description: 'Beschreibung',
        industry: 'Branche',
        target: 'Zielgruppe',
        instructions: `\n\nWICHTIG: Alle Slogans müssen UNTERSCHIEDLICH voneinander und auf ${languageName} sein.\n\nFür jeden Slogan gib an:
1. Den Slogan selbst (kurz, wirkungsvoll, einprägsam, EINZIGARTIG)
2. Eine detaillierte Erklärung der Positionierung und Strategie
3. Eine Einprägsamkeitsbewertung von 0 bis 100
4. Eine Kategorie aus: Innovation, Emotion, Vorteil, Aspiration, Beschreibend, Provokativ, Humorvoll

Antworte NUR mit einem gültigen JSON-Objekt in diesem exakten Format:
{
  "slogans": [
    {
      "slogan": "Der Slogan hier",
      "explanation": "Detaillierte Erklärung hier",
      "memorabilityScore": 85,
      "category": "Innovation"
    }
  ]
}

Generiere 10 VIELFÄLTIGE und KREATIVE Slogans.`,
      },
      es: {
        intro: `Genera exactamente 10 eslóganes DIFERENTES, creativos y memorables en ${languageName} para la marca "${dto.brandName}".`,
        description: 'Descripción',
        industry: 'Sector',
        target: 'Público objetivo',
        instructions: `\n\nIMPORTANTE: Todos los eslóganes deben ser DIFERENTES entre sí y en ${languageName}.\n\nPara cada eslogan, proporciona:
1. El eslogan en sí (corto, impactante, memorable, ÚNICO)
2. Una explicación detallada del posicionamiento y estrategia
3. Una puntuación de memorabilidad de 0 a 100
4. Una categoría entre: Innovación, Emoción, Beneficio, Aspiración, Descriptivo, Provocador, Humorístico

Responde SOLO con un objeto JSON válido en este formato exacto:
{
  "slogans": [
    {
      "slogan": "El eslogan aquí",
      "explanation": "Explicación detallada aquí",
      "memorabilityScore": 85,
      "category": "Innovación"
    }
  ]
}

Genera 10 eslóganes VARIADOS y CREATIVOS.`,
      },
    };

    const template = templates[language] || templates['en'];
    let prompt = template.intro;

    if (dto.description) {
      prompt += `\n\n${template.description}: ${dto.description}`;
    }
    if (dto.industry) {
      prompt += `\n${template.industry}: ${dto.industry}`;
    }
    if (dto.targetAudience) {
      prompt += `\n${template.target}: ${dto.targetAudience}`;
    }

    prompt += template.instructions;

    return prompt;
  }

  private parseSlogans(response: any): SloganDto[] {
    if (!response.slogans || !Array.isArray(response.slogans)) {
      console.error('[AI Service] Invalid response structure. Expected {slogans: [...]}, got:', JSON.stringify(response, null, 2));
      throw new Error('Invalid response format from Gemini');
    }

    return response.slogans.map((item: any) => ({
      slogan: item.slogan || '',
      explanation: item.explanation || '',
      memorabilityScore: Math.min(100, Math.max(0, item.memorabilityScore || 0)),
      category: item.category || 'Descriptif',
    }));
  }

  async saveSlogan(dto: SloganDto, userId: string): Promise<Slogan> {
    const newSlogan = new this.sloganModel({
      ...dto,
      userId,
    });
    return newSlogan.save();
  }

  async getHistory(userId: string): Promise<Slogan[]> {
    return this.sloganModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getFavorites(userId: string): Promise<Slogan[]> {
    return this.sloganModel.find({ userId, isFavorite: true }).sort({ createdAt: -1 }).exec();
  }

  async toggleFavorite(id: string, userId: string): Promise<Slogan> {
    const slogan = await this.sloganModel.findOne({ _id: id, userId });
    if (!slogan) {
      throw new NotFoundException('Slogan focus for this user not found');
    }
    slogan.isFavorite = !slogan.isFavorite;
    return slogan.save();
  }

  async deleteSlogan(id: string, userId: string): Promise<void> {
    const result = await this.sloganModel.deleteOne({ _id: id, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Slogan not found or not owned by user');
    }
  }
}

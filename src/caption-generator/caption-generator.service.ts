import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { GenerateCaptionDto } from './dto/generate-caption.dto';
import { GeneratedCaption, GeneratedCaptionDocument } from './schemas/generated-caption.schema';
import { TrendingHashtagsService } from '../trending-hashtags/trending-hashtags.service';

@Injectable()
export class CaptionGeneratorService {
  private genAI: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    @InjectModel(GeneratedCaption.name) private captionModel: Model<GeneratedCaptionDocument>,
    private trendingHashtagsService: TrendingHashtagsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generateCaption(dto: GenerateCaptionDto, userId: string, imageUrl?: string) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      const fallback = await this.getFallback(dto);
      return this.saveCaption(userId, dto, fallback, imageUrl);
    }

    const langMap: Record<string, string> = { fr: 'français', en: 'English', ar: 'arabe (darija tunisien)' };
    const ctaMap: Record<string, string> = { hard: 'CTA direct (achat, inscription)', soft: 'CTA doux (engagement, partage)', educational: 'CTA éducatif (apprendre, découvrir)' };

    // Récupérer les hashtags tendances
    const category = this.detectCategory(dto.brandName, dto.postTitle);
    const trendingHashtags = await this.trendingHashtagsService.generateHashtagsForPost(
      dto.brandName,
      dto.postTitle,
      category,
      dto.platform,
    );

    const prompt = `Génère 3 versions de caption pour un post ${dto.platform} en ${langMap[dto.language] || 'français'}.
- Titre du post : ${dto.postTitle}
- Format : ${dto.format}
- Pilier de contenu : ${dto.pillar}
- Type de CTA : ${ctaMap[dto.ctaType]}
- Marque : ${dto.brandName}

Réponds UNIQUEMENT avec un JSON valide :
{
  "short": "caption courte max 50 mots",
  "medium": "caption moyenne max 100 mots",
  "long": "caption longue max 200 mots",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "emojis": ["🔥", "💪", "✨", "🎯", "💡"],
  "cta": "Une phrase CTA percutante"
}`;

    try {
      const model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';
      const result = await this.genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.8, maxOutputTokens: 1000 },
      });

      let content = result.text?.trim() || '';
      if (content.startsWith('```')) {
        content = content.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
      }
      content = content.replace(/,(\s*[}\]])/g, '$1');

      const captions = JSON.parse(content);
      
      // Remplacer les hashtags générés par Gemini avec les hashtags tendances
      captions.hashtags = trendingHashtags;
      
      return this.saveCaption(userId, dto, captions, imageUrl);
    } catch {
      const fallback = await this.getFallback(dto);
      return this.saveCaption(userId, dto, fallback, imageUrl);
    }
  }

  private async saveCaption(userId: string, dto: GenerateCaptionDto, captions: any, imageUrl?: string) {
    const caption = await this.captionModel.create({
      userId,
      postTitle: dto.postTitle,
      platform: dto.platform,
      format: dto.format,
      pillar: dto.pillar,
      ctaType: dto.ctaType,
      language: dto.language,
      brandName: dto.brandName,
      captions,
      imageUrl: imageUrl || null,
    });
    return caption;
  }

  async getHistory(userId: string) {
    return this.captionModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
  }

  async toggleFavorite(userId: string, captionId: string) {
    const caption = await this.captionModel.findOne({ _id: captionId, userId });
    if (!caption) throw new NotFoundException('Caption not found');
    caption.isFavorite = !caption.isFavorite;
    await caption.save();
    return caption;
  }

  async deleteCaption(userId: string, captionId: string) {
    const result = await this.captionModel.deleteOne({ _id: captionId, userId });
    if (result.deletedCount === 0) throw new NotFoundException('Caption not found');
    return { success: true };
  }

  private async getFallback(dto: GenerateCaptionDto) {
    // Récupérer les hashtags tendances pour le fallback aussi
    const category = this.detectCategory(dto.brandName, dto.postTitle);
    const trendingHashtags = await this.trendingHashtagsService.generateHashtagsForPost(
      dto.brandName,
      dto.postTitle,
      category,
      dto.platform,
    );

    return {
      short: `✨ ${dto.postTitle} — ${dto.brandName}`,
      medium: `Découvrez ${dto.postTitle} par ${dto.brandName}. Une solution pensée pour vous. Rejoignez notre communauté et transformez votre quotidien.`,
      long: `${dto.postTitle} 🚀\n\nChez ${dto.brandName}, nous croyons que chaque détail compte. Ce ${dto.format} vous présente notre vision du ${dto.pillar}.\n\nPrêt à passer à l'action ? Découvrez comment nous pouvons vous aider à atteindre vos objectifs.\n\n👇 Lien en bio`,
      hashtags: trendingHashtags,
      emojis: ['✨', '🚀', '💡', '🎯', '💪'],
      cta: dto.ctaType === 'hard' ? '👉 Achetez maintenant !' : dto.ctaType === 'soft' ? '❤️ Partagez si vous aimez !' : '📚 Apprenez-en plus en bio !',
    };
  }

  /**
   * Détecter la catégorie basée sur le nom de la marque et le titre du post
   */
  private detectCategory(brandName: string, postTitle: string): string {
    const text = `${brandName} ${postTitle}`.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      cosmetics: ['makeup', 'cosmetic', 'beauty', 'skincare', 'lipstick', 'foundation', 'mascara', 'lela'],
      sports: ['sport', 'fitness', 'gym', 'workout', 'training', 'athlete', 'nike', 'adidas', 'running'],
      fashion: ['fashion', 'style', 'clothing', 'apparel', 'outfit', 'zara', 'h&m', 'dress'],
      food: ['food', 'restaurant', 'cuisine', 'meal', 'recipe', 'cooking', 'mcdonald', 'burger'],
      technology: ['tech', 'software', 'app', 'digital', 'innovation', 'apple', 'samsung', 'google'],
      lifestyle: ['lifestyle', 'life', 'home', 'living', 'wellness', 'mindset'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category;
      }
    }

    return 'lifestyle'; // Catégorie par défaut
  }
}

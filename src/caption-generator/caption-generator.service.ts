import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { GenerateCaptionDto } from './dto/generate-caption.dto';

@Injectable()
export class CaptionGeneratorService {
  private genAI: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async generateCaption(dto: GenerateCaptionDto) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      return this.getFallback(dto);
    }

    const langMap: Record<string, string> = { fr: 'français', en: 'English', ar: 'arabe (darija tunisien)' };
    const ctaMap: Record<string, string> = { hard: 'CTA direct (achat, inscription)', soft: 'CTA doux (engagement, partage)', educational: 'CTA éducatif (apprendre, découvrir)' };

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

      return JSON.parse(content);
    } catch {
      return this.getFallback(dto);
    }
  }

  private getFallback(dto: GenerateCaptionDto) {
    return {
      short: `✨ ${dto.postTitle} — ${dto.brandName}`,
      medium: `Découvrez ${dto.postTitle} par ${dto.brandName}. Une solution pensée pour vous. Rejoignez notre communauté et transformez votre quotidien.`,
      long: `${dto.postTitle} 🚀\n\nChez ${dto.brandName}, nous croyons que chaque détail compte. Ce ${dto.format} vous présente notre vision du ${dto.pillar}.\n\nPrêt à passer à l'action ? Découvrez comment nous pouvons vous aider à atteindre vos objectifs.\n\n👇 Lien en bio`,
      hashtags: [`#${dto.brandName.replace(/\s/g, '')}`, `#${dto.platform}`, `#${dto.pillar.replace(/\s/g, '')}`, '#marketing', '#ideaspark'],
      emojis: ['✨', '🚀', '💡', '🎯', '💪'],
      cta: dto.ctaType === 'hard' ? '👉 Achetez maintenant !' : dto.ctaType === 'soft' ? '❤️ Partagez si vous aimez !' : '📚 Apprenez-en plus en bio !',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class PostAnalyzerService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }
  }

  async analyzePost(data: {
    caption: string;
    hashtags: string[];
    imageUrl?: string;
    scheduledTime?: string;
    platform: string;
  }) {
    if (!this.model) {
      return this.getFallbackAnalysis(data);
    }

    try {
      const prompt = `Analyse ce post pour ${data.platform} et donne un score détaillé:

Caption: "${data.caption}"
Hashtags: ${data.hashtags.join(', ')}
Heure prévue: ${data.scheduledTime || 'Non définie'}

Analyse selon ces critères (score 0-100 pour chaque):
1. Caption: qualité du texte, hook, CTA, longueur, emojis
2. Hashtags: pertinence, mix popularité/niche, nombre
3. Timing: heure optimale selon la plateforme
4. Structure: organisation du contenu

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "overallScore": 85,
  "scores": {
    "caption": {"score": 90, "feedback": "Excellent hook"},
    "hashtags": {"score": 75, "feedback": "Ajoutez des hashtags de niche"},
    "timing": {"score": 85, "feedback": "Bonne heure"},
    "structure": {"score": 90, "feedback": "Bien organisé"}
  },
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "predictedEngagement": "high"
}`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      
      return JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('Error analyzing post:', error);
      return this.getFallbackAnalysis(data);
    }
  }

  private getFallbackAnalysis(data: any) {
    const captionScore = this.analyzeCaptionFallback(data.caption);
    const hashtagScore = this.analyzeHashtagsFallback(data.hashtags);
    const timingScore = 85;
    const structureScore = 80;

    const overallScore = Math.round(
      (captionScore + hashtagScore + timingScore + structureScore) / 4
    );

    return {
      overallScore,
      scores: {
        caption: {
          score: captionScore,
          feedback: captionScore > 80 ? 'Bon caption' : 'Caption à améliorer'
        },
        hashtags: {
          score: hashtagScore,
          feedback: hashtagScore > 80 ? 'Bons hashtags' : 'Ajoutez plus de hashtags'
        },
        timing: {
          score: timingScore,
          feedback: 'Heure correcte'
        },
        structure: {
          score: structureScore,
          feedback: 'Structure acceptable'
        }
      },
      suggestions: [
        'Ajoutez des emojis pour plus d\'engagement',
        'Utilisez un CTA clair',
        'Variez vos hashtags entre populaires et niche'
      ],
      predictedEngagement: overallScore > 80 ? 'high' : overallScore > 60 ? 'medium' : 'low'
    };
  }

  private analyzeCaptionFallback(caption: string): number {
    let score = 50;
    if (caption.length > 50) score += 10;
    if (caption.length > 100) score += 10;
    if (/[!?]/.test(caption)) score += 10;
    // Check for emojis using Unicode ranges
    if (/[\u{1F600}-\u{1F64F}]/u.test(caption)) score += 10;
    if (/(cliquez|découvrez|suivez|commentez)/i.test(caption)) score += 10;
    return Math.min(score, 100);
  }

  private analyzeHashtagsFallback(hashtags: string[]): number {
    let score = 50;
    if (hashtags.length >= 5) score += 20;
    if (hashtags.length >= 10) score += 15;
    if (hashtags.length >= 15) score += 15;
    return Math.min(score, 100);
  }
}

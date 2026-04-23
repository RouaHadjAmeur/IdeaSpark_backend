import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ViralHooksService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }
  }

  async generateHooks(data: {
    topic: string;
    platform: string;
    tone: string;
    count: number;
  }) {
    if (!this.model) {
      return this.getFallbackHooks(data);
    }

    try {
      const prompt = `Génère ${data.count} hooks viraux pour ${data.platform} sur le sujet: "${data.topic}"

Ton: ${data.tone}
Plateforme: ${data.platform}

Les hooks doivent:
- Commencer par des patterns viraux (POV:, Personne ne parle de..., 3 secrets..., Stop!, etc.)
- Être courts et percutants (max 100 caractères)
- Inclure des emojis pertinents
- Créer de la curiosité ou de l'urgence
- Être adaptés à ${data.platform}

Réponds UNIQUEMENT en JSON valide avec cette structure:
{
  "hooks": ["hook 1", "hook 2", "hook 3"]
}`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      
      return JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('Error generating hooks:', error);
      return this.getFallbackHooks(data);
    }
  }

  private getFallbackHooks(data: any) {
    const templates = [
      `POV: Tu découvres ${data.topic} et tout change 🤯`,
      `Personne ne parle de cette astuce ${data.topic} 🤫`,
      `3 secrets sur ${data.topic} que tu dois connaître 👀`,
      `Stop! Tu fais cette erreur avec ${data.topic} ❌`,
      `${data.topic}: ce que personne ne te dit 😱`,
      `La vérité sur ${data.topic} va te choquer 🔥`,
      `Comment ${data.topic} a changé ma vie en 30 jours ✨`,
      `${data.topic}: le guide que j'aurais aimé avoir 📚`,
      `Attention: ${data.topic} n'est pas ce que tu crois 🚨`,
      `Le secret des pros de ${data.topic} révélé 💎`
    ];

    return {
      hooks: templates.slice(0, data.count || 5)
    };
  }
}

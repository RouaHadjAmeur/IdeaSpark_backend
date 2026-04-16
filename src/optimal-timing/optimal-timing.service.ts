import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class OptimalTimingService {
  private genAI: GoogleGenerativeAI;
  private model;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    }
  }

  async predictOptimalTiming(data: {
    userId: string;
    platform: string;
    contentType: string;
  }) {
    if (!this.model) {
      return this.getFallbackTiming(data);
    }

    try {
      const prompt = `Suggère les meilleurs moments pour poster sur ${data.platform} pour du contenu de type "${data.contentType}".

Analyse selon:
- Les heures de forte activité sur ${data.platform}
- Le type de contenu: ${data.contentType}
- Les tendances actuelles
- Les fuseaux horaires

Donne 3 meilleurs moments et 2 pires moments.

Réponds UNIQUEMENT en JSON valide avec cette structure:
{
  "bestTimes": [
    {
      "day": "tuesday",
      "time": "18:00",
      "score": 95,
      "reason": "Pic d'activité après le travail",
      "expectedEngagement": "+45%"
    }
  ],
  "worstTimes": [
    {
      "day": "sunday",
      "time": "03:00",
      "score": 15,
      "reason": "Audience inactive"
    }
  ]
}`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      
      return JSON.parse(jsonText.trim());
    } catch (error) {
      console.error('Error predicting timing:', error);
      return this.getFallbackTiming(data);
    }
  }

  private getFallbackTiming(data: any) {
    const platformTiming = {
      instagram: {
        bestTimes: [
          {
            day: 'tuesday',
            time: '18:00',
            score: 95,
            reason: 'Pic d\'activité après le travail',
            expectedEngagement: '+45%'
          },
          {
            day: 'thursday',
            time: '12:30',
            score: 88,
            reason: 'Pause déjeuner, forte activité',
            expectedEngagement: '+35%'
          },
          {
            day: 'wednesday',
            time: '20:00',
            score: 85,
            reason: 'Soirée, temps libre',
            expectedEngagement: '+30%'
          }
        ],
        worstTimes: [
          {
            day: 'sunday',
            time: '03:00',
            score: 15,
            reason: 'Audience inactive'
          },
          {
            day: 'monday',
            time: '06:00',
            score: 25,
            reason: 'Début de semaine, faible engagement'
          }
        ]
      },
      tiktok: {
        bestTimes: [
          {
            day: 'friday',
            time: '19:00',
            score: 98,
            reason: 'Début du weekend, forte activité',
            expectedEngagement: '+50%'
          },
          {
            day: 'tuesday',
            time: '16:00',
            score: 90,
            reason: 'Après-midi, pause scroll',
            expectedEngagement: '+40%'
          },
          {
            day: 'thursday',
            time: '21:00',
            score: 87,
            reason: 'Soirée détente',
            expectedEngagement: '+38%'
          }
        ],
        worstTimes: [
          {
            day: 'saturday',
            time: '04:00',
            score: 10,
            reason: 'Nuit du weekend'
          },
          {
            day: 'monday',
            time: '07:00',
            score: 20,
            reason: 'Rush matinal'
          }
        ]
      },
      facebook: {
        bestTimes: [
          {
            day: 'wednesday',
            time: '13:00',
            score: 92,
            reason: 'Pause déjeuner milieu de semaine',
            expectedEngagement: '+42%'
          },
          {
            day: 'thursday',
            time: '19:00',
            score: 88,
            reason: 'Soirée active',
            expectedEngagement: '+36%'
          },
          {
            day: 'friday',
            time: '15:00',
            score: 85,
            reason: 'Fin de semaine détendue',
            expectedEngagement: '+32%'
          }
        ],
        worstTimes: [
          {
            day: 'sunday',
            time: '02:00',
            score: 12,
            reason: 'Nuit du weekend'
          },
          {
            day: 'saturday',
            time: '05:00',
            score: 18,
            reason: 'Tôt le matin'
          }
        ]
      }
    };

    return platformTiming[data.platform.toLowerCase()] || platformTiming.instagram;
  }
}

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { GeneratedImage, GeneratedImageDocument } from './schemas/generated-image.schema';
import { GenerateImageDto } from './dto/generate-image.dto';

@Injectable()
export class AiImageGeneratorService {
  private unsplashKey: string;
  private pexelsKey: string;

  constructor(
    @InjectModel(GeneratedImage.name) private imageModel: Model<GeneratedImageDocument>,
    private configService: ConfigService,
  ) {
    this.unsplashKey = this.configService.get<string>('UNSPLASH_ACCESS_KEY') || '';
    this.pexelsKey = this.configService.get<string>('PEXELS_API_KEY') || '';
  }

  async generateImage(userId: string, dto: GenerateImageDto) {
    const styleKeywords: Record<string, string> = {
      minimalist: 'minimal clean simple white background',
      colorful: 'colorful vibrant bright',
      professional: 'professional high quality studio',
      fun: 'fun playful creative',
    };

    // Mots-clés par catégorie (PRIORITÉ ABSOLUE avec plus de mots-clés)
    const categoryKeywords: Record<string, string> = {
      cosmetics: 'cosmetics makeup skincare beauty products lipstick foundation eyeshadow',
      beauty: 'spa wellness massage salon treatment facial',
      sports: 'sports fitness athletic training gym workout exercise',
      fashion: 'fashion clothing apparel style outfit wardrobe',
      food: 'food cuisine restaurant meal dish culinary',
      technology: 'technology gadget device software digital tech',
      lifestyle: 'lifestyle modern home interior design living',
    };

    // 🆕 AMÉLIORATION 1: Détecter l'objet spécifique (format: "objet - description")
    const parts = dto.description.split(' - ');
    let specificObject = '';
    let mainDescription = dto.description;

    if (parts.length > 1 && parts[0].split(' ').length <= 3) {
      // Premier mot(s) est probablement l'objet spécifique
      specificObject = parts[0].trim();
      mainDescription = parts.slice(1).join(' - ');
      console.log(`[AiImageGenerator] ✨ Specific object detected: "${specificObject}"`);
    }

    let query = '';

    if (dto.category && categoryKeywords[dto.category]) {
      // ✅ CATÉGORIE SPÉCIFIÉE: Priorité absolue à la catégorie
      
      // 🆕 AMÉLIORATION 1: Objet spécifique en PREMIER si présent
      if (specificObject) {
        query = `${specificObject} `;
      }
      
      // Ajouter les mots-clés de catégorie
      query += `${categoryKeywords[dto.category]} `;
      
      // Ajouter la marque
      if (dto.brandName) {
        query += `${dto.brandName} `;
      }
      
      // Ajouter seulement les 2 premiers mots de la description principale
      const descWords = mainDescription.split(' ').slice(0, 2).join(' ');
      query += `${descWords} `;
      
      // Ajouter le style
      query += styleKeywords[dto.style] || '';
      query = query.trim();
    } else {
      // ❌ PAS DE CATÉGORIE: Utiliser la description complète
      if (specificObject) {
        query = `${specificObject} `;
      }
      query += `${dto.brandName || ''} ${mainDescription} ${styleKeywords[dto.style] || ''}`.trim();
    }

    // 🆕 AMÉLIORATION 2: Logs enrichis
    console.log(`[AiImageGenerator] 📊 Generation request:`);
    console.log(`[AiImageGenerator]   - Category: ${dto.category || 'none'}`);
    console.log(`[AiImageGenerator]   - Brand: ${dto.brandName || 'none'}`);
    console.log(`[AiImageGenerator]   - Style: ${dto.style}`);
    if (specificObject) {
      console.log(`[AiImageGenerator]   - Specific object: "${specificObject}" ⭐`);
    }
    console.log(`[AiImageGenerator]   - Description: "${mainDescription}"`);
    console.log(`[AiImageGenerator]   - Final query: "${query}"`);

    // Try Unsplash first (50 req/hour)
    if (this.unsplashKey) {
      try {
        console.log(`[AiImageGenerator] 🔍 Searching Unsplash...`);
        const imageUrl = await this.fetchFromUnsplash(query);
        console.log(`[AiImageGenerator] ✅ Unsplash success: ${imageUrl.substring(0, 50)}...`);
        return this.saveImage(userId, imageUrl, query, dto.style, dto.brandName, dto.category, specificObject);
      } catch (error) {
        console.log('[AiImageGenerator] ❌ Unsplash failed, trying Pexels...');
      }
    }

    // Fallback to Pexels (200 req/hour)
    if (this.pexelsKey) {
      try {
        console.log(`[AiImageGenerator] 🔍 Searching Pexels...`);
        const imageUrl = await this.fetchFromPexels(query);
        console.log(`[AiImageGenerator] ✅ Pexels success: ${imageUrl.substring(0, 50)}...`);
        return this.saveImage(userId, imageUrl, query, dto.style, dto.brandName, dto.category, specificObject);
      } catch (error) {
        console.log('[AiImageGenerator] ❌ Pexels failed');
      }
    }

    throw new HttpException('No image API configured or quota exceeded', HttpStatus.SERVICE_UNAVAILABLE);
  }

  private async fetchFromUnsplash(query: string): Promise<string> {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&count=1`,
      { headers: { Authorization: `Client-ID ${this.unsplashKey}` } },
    );

    if (!response.ok) throw new Error('Unsplash API error');
    const data = await response.json();
    return data[0]?.urls?.regular || data.urls?.regular;
  }

  private async fetchFromPexels(query: string): Promise<string> {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`,
      { headers: { Authorization: this.pexelsKey } },
    );

    if (!response.ok) throw new Error('Pexels API error');
    const data = await response.json();
    return data.photos[0]?.src?.large;
  }

  private async saveImage(
    userId: string,
    url: string,
    prompt: string,
    style: string,
    brandName?: string,
    category?: string,
    specificObject?: string,
  ) {
    // 🆕 AMÉLIORATION 3: Sauvegarder l'objet spécifique pour statistiques
    const image = await this.imageModel.create({
      userId,
      url,
      prompt,
      style,
      brandName,
      category,
      specificObject,
    });

    console.log(`[AiImageGenerator] 💾 Saved to database: ${image._id}`);
    if (specificObject) {
      console.log(`[AiImageGenerator] 📊 Specific object tracked: "${specificObject}"`);
    }

    return image;
  }

  async getHistory(userId: string) {
    return this.imageModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
  }

  async deleteImage(userId: string, imageId: string) {
    const result = await this.imageModel.deleteOne({ _id: imageId, userId });
    if (result.deletedCount === 0) throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
    return { success: true };
  }

  /**
   * 🆕 AMÉLIORATION 3: Statistiques des objets spécifiques les plus utilisés
   */
  async getStatistics(userId: string) {
    // Top 10 objets spécifiques les plus utilisés
    const topObjects = await this.imageModel.aggregate([
      { $match: { userId, specificObject: { $exists: true, $ne: '' } } },
      { $group: { _id: '$specificObject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { object: '$_id', count: 1, _id: 0 } },
    ]);

    // Top 5 catégories les plus utilisées
    const topCategories = await this.imageModel.aggregate([
      { $match: { userId, category: { $exists: true, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    // Total d'images générées
    const totalImages = await this.imageModel.countDocuments({ userId });

    // Images générées dans les dernières 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const imagesLast24h = await this.imageModel.countDocuments({
      userId,
      createdAt: { $gte: yesterday },
    });

    console.log(`[AiImageGenerator] 📊 Statistics generated for user ${userId}`);

    return {
      totalImages,
      imagesLast24h,
      topObjects,
      topCategories,
    };
  }
}

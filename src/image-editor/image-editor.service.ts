import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { EditedImage, ImageFilter, ImageFrame, ImageEffect } from './schemas/edited-image.schema';
import { ProcessImageDto, TextOverlayDto } from './dto/process-image.dto';

@Injectable()
export class ImageEditorService {
  constructor(@InjectModel(EditedImage.name) private editedImageModel: Model<EditedImage>) {}

  async processEditedImage(userId: string, dto: ProcessImageDto): Promise<EditedImage> {
    try {
      console.log('🖼️ [ImageEditor] Processing image...');
      console.log('🖼️ [ImageEditor] Original URL:', dto.imageUrl);
      console.log('🖼️ [ImageEditor] Filter:', dto.filter);
      console.log('🖼️ [ImageEditor] Frame:', dto.frame);

      // 1. Télécharger l'image originale
      const imageBuffer = await this.downloadImage(dto.imageUrl);

      // 2. Créer une instance Sharp
      let image = sharp(imageBuffer);

      // 3. Appliquer le filtre
      if (dto.filter && dto.filter !== ImageFilter.NONE) {
        image = await this.applyFilter(image, dto.filter);
      }

      // 4. Appliquer les effets
      if (dto.effects && dto.effects.length > 0) {
        image = await this.applyEffects(image, dto.effects);
      }

      // 5. Redimensionner si nécessaire
      if (dto.resizedWidth && dto.resizedHeight) {
        image = image.resize(dto.resizedWidth, dto.resizedHeight, {
          fit: 'cover',
          position: 'center'
        });
      }

      // 6. Ajouter le cadre
      if (dto.frame && dto.frame !== ImageFrame.NONE) {
        image = await this.addFrame(image, dto.frame, dto.frameColor);
      }

      // 7. Traitement initial
      let processedBuffer = await image.png().toBuffer();

      // 8. Ajouter le texte (avec Canvas)
      if (dto.textOverlays && dto.textOverlays.length > 0) {
        processedBuffer = await this.addTextOverlays(processedBuffer, dto.textOverlays);
      }

      // 9. Sauvegarder l'image finale
      const editedUrl = await this.saveProcessedImage(processedBuffer);

      // 10. Créer l'entrée en base de données
      const editedImage = new this.editedImageModel({
        userId,
        originalUrl: dto.imageUrl,
        editedUrl,
        filter: dto.filter || ImageFilter.NONE,
        frame: dto.frame || ImageFrame.NONE,
        frameColor: dto.frameColor,
        textOverlays: dto.textOverlays || [],
        effects: dto.effects || [],
        resizedWidth: dto.resizedWidth,
        resizedHeight: dto.resizedHeight,
      });

      const savedImage = await editedImage.save();

      console.log('✅ [ImageEditor] Image processed:', savedImage._id);
      console.log('✅ [ImageEditor] Edited URL:', editedUrl);

      return savedImage;
    } catch (error) {
      console.error('❌ [ImageEditor] Error:', error.message);
      throw new HttpException(
        error.message || 'Erreur lors du traitement de l\'image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getHistory(userId: string, limit: number = 20, skip: number = 0): Promise<{ images: EditedImage[]; total: number }> {
    try {
      const images = await this.editedImageModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();

      const total = await this.editedImageModel.countDocuments({ userId });

      return { images, total };
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération de l\'historique',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      throw new HttpException('Impossible de télécharger l\'image', HttpStatus.BAD_REQUEST);
    }
  }

  private async applyFilter(image: sharp.Sharp, filter: ImageFilter): Promise<sharp.Sharp> {
    switch (filter) {
      case ImageFilter.BLACK_AND_WHITE:
        return image.grayscale();
      
      case ImageFilter.SEPIA:
        return image.tint({ r: 255, g: 240, b: 196 });
      
      case ImageFilter.VINTAGE:
        return image
          .modulate({ brightness: 0.9, saturation: 0.8 })
          .tint({ r: 255, g: 228, b: 181 });
      
      case ImageFilter.COOL:
        return image.tint({ r: 173, g: 216, b: 230 });
      
      case ImageFilter.WARM:
        return image.tint({ r: 255, g: 218, b: 185 });
      
      case ImageFilter.BRIGHT:
        return image.modulate({ brightness: 1.3 });
      
      case ImageFilter.DARK:
        return image.modulate({ brightness: 0.7 });
      
      default:
        return image;
    }
  }

  private async applyEffects(image: sharp.Sharp, effects: ImageEffect[]): Promise<sharp.Sharp> {
    let processedImage = image;

    for (const effect of effects) {
      switch (effect) {
        case ImageEffect.BLUR:
          processedImage = processedImage.blur(2);
          break;
        
        case ImageEffect.SHARPEN:
          processedImage = processedImage.sharpen();
          break;
        
        case ImageEffect.EMBOSS:
          processedImage = processedImage.convolve({
            width: 3,
            height: 3,
            kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2]
          });
          break;
        
        // Shadow et Glow nécessitent un traitement plus complexe
        case ImageEffect.SHADOW:
        case ImageEffect.GLOW:
          // Implémentation simplifiée - peut être améliorée
          processedImage = processedImage.modulate({ brightness: 0.9 });
          break;
      }
    }

    return processedImage;
  }

  private async addFrame(image: sharp.Sharp, frame: ImageFrame, frameColor?: number): Promise<sharp.Sharp> {
    const metadata = await image.metadata();
    const { width, height } = metadata;

    switch (frame) {
      case ImageFrame.SIMPLE:
        return image.extend({
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: frameColor ? `#${frameColor.toString(16).padStart(6, '0')}` : '#FFFFFF'
        });
      
      case ImageFrame.ROUNDED:
        // Créer un masque arrondi
        const roundedMask = Buffer.from(
          `<svg><rect x="0" y="0" width="${width}" height="${height}" rx="20" ry="20" fill="white"/></svg>`
        );
        return image.composite([{ input: roundedMask, blend: 'dest-in' }]);
      
      case ImageFrame.SHADOW:
        return image.extend({
          top: 5,
          bottom: 15,
          left: 5,
          right: 15,
          background: '#00000020'
        });
      
      case ImageFrame.POLAROID:
        return image.extend({
          top: 20,
          bottom: 60,
          left: 20,
          right: 20,
          background: '#FFFFFF'
        });
      
      case ImageFrame.FILM:
        return image.extend({
          top: 30,
          bottom: 30,
          left: 10,
          right: 10,
          background: '#000000'
        });
      
      default:
        return image;
    }
  }

  private async addTextOverlays(imageBuffer: Buffer, overlays: TextOverlayDto[]): Promise<Buffer> {
    try {
      const { createCanvas, loadImage } = require('canvas');
      
      // Charger l'image dans Canvas
      const img = await loadImage(imageBuffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');

      // Dessiner l'image de base
      ctx.drawImage(img, 0, 0);

      // Ajouter chaque overlay de texte
      for (const overlay of overlays) {
        const fontWeight = overlay.bold ? 'bold' : 'normal';
        const fontStyle = overlay.italic ? 'italic' : 'normal';
        
        ctx.font = `${fontStyle} ${fontWeight} ${overlay.fontSize}px Arial`;
        ctx.fillStyle = `#${overlay.color.toString(16).padStart(6, '0')}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Ajouter une ombre pour améliorer la lisibilité
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const x = overlay.x * img.width;
        const y = overlay.y * img.height;
        
        ctx.fillText(overlay.text, x, y);
      }

      return canvas.toBuffer('image/png');
    } catch (error) {
      console.error('❌ [ImageEditor] Text overlay error:', error);
      return imageBuffer; // Retourner l'image sans texte en cas d'erreur
    }
  }

  private async saveProcessedImage(imageBuffer: Buffer): Promise<string> {
    try {
      // Créer le dossier s'il n'existe pas
      const uploadDir = path.join(process.cwd(), 'uploads', 'edited-images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Générer un nom de fichier unique
      const filename = `edited_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
      const filepath = path.join(uploadDir, filename);

      // Sauvegarder le fichier
      fs.writeFileSync(filepath, imageBuffer);

      // Retourner l'URL relative
      return `/uploads/edited-images/${filename}`;
    } catch (error) {
      throw new HttpException('Erreur lors de la sauvegarde', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteEditedImage(imageId: string, userId: string): Promise<void> {
    try {
      const image = await this.editedImageModel.findById(imageId);

      if (!image) {
        throw new HttpException('Image non trouvée', HttpStatus.NOT_FOUND);
      }

      if (image.userId !== userId) {
        throw new HttpException(
          'Vous n\'avez pas la permission de supprimer cette image',
          HttpStatus.FORBIDDEN,
        );
      }

      // Supprimer le fichier physique
      if (image.editedUrl) {
        const filepath = path.join(process.cwd(), image.editedUrl);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }

      // Supprimer de la base de données
      await this.editedImageModel.findByIdAndDelete(imageId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de la suppression de l\'image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
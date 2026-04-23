import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video } from './schemas/video.schema';
import { CreateVideoDto } from './dto/create-video.dto';
import axios from 'axios';

@Injectable()
export class VideoGeneratorService {
  private readonly pexelsApiKey = process.env.PEXELS_API_KEY;
  private readonly pexelsApiUrl = 'https://api.pexels.com/videos/search';

  constructor(@InjectModel(Video.name) private videoModel: Model<Video>) {}

  async generateVideo(userId: string, createVideoDto: CreateVideoDto): Promise<Video> {
    try {
      console.log('🎬 [VideoGenerator] Generating video...');
      console.log('🎬 [VideoGenerator] Description:', createVideoDto.description);
      console.log('🎬 [VideoGenerator] Duration:', createVideoDto.duration);
      console.log('🎬 [VideoGenerator] Orientation:', createVideoDto.orientation);

      // Construire la requête de recherche
      const query = this.buildSearchQuery(
        createVideoDto.description,
        createVideoDto.category,
      );

      // Appeler l'API Pexels
      const response = await axios.get(this.pexelsApiUrl, {
        headers: {
          Authorization: this.pexelsApiKey,
        },
        params: {
          query,
          per_page: 1,
          orientation: createVideoDto.orientation || 'landscape',
        },
      });

      if (!response.data.videos || response.data.videos.length === 0) {
        throw new HttpException(
          'Aucune vidéo trouvée pour cette recherche',
          HttpStatus.NOT_FOUND,
        );
      }

      const pexelsVideo = response.data.videos[0];
      const videoFile = this.selectVideoFile(pexelsVideo, createVideoDto.duration);

      if (!videoFile) {
        throw new HttpException(
          'Format vidéo non disponible',
          HttpStatus.NOT_FOUND,
        );
      }

      // Créer le document vidéo
      const video = new this.videoModel({
        userId,
        description: createVideoDto.description,
        category: createVideoDto.category,
        duration: createVideoDto.duration || 'medium',
        orientation: createVideoDto.orientation || 'landscape',
        videoUrl: videoFile.link,
        thumbnailUrl: pexelsVideo.image,
        videoDuration: pexelsVideo.duration,
        width: pexelsVideo.width,
        height: pexelsVideo.height,
        author: pexelsVideo.user.name,
        authorUrl: pexelsVideo.user.url,
        source: 'pexels',
        pexelsVideoId: pexelsVideo.id,
      });

      const savedVideo = await video.save();

      console.log('✅ [VideoGenerator] Video generated:', savedVideo._id);
      console.log('✅ [VideoGenerator] Duration:', pexelsVideo.duration);
      console.log('✅ [VideoGenerator] Resolution:', `${pexelsVideo.width}x${pexelsVideo.height}`);

      return savedVideo;
    } catch (error) {
      console.error('❌ [VideoGenerator] Error:', error.message);
      throw new HttpException(
        error.message || 'Erreur lors de la génération de la vidéo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getHistory(userId: string, limit: number = 20, skip: number = 0): Promise<{ videos: Video[]; total: number }> {
    try {
      const videos = await this.videoModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();

      const total = await this.videoModel.countDocuments({ userId });

      return { videos, total };
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération de l\'historique',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getVideoById(videoId: string): Promise<Video> {
    try {
      const video = await this.videoModel.findById(videoId);

      if (!video) {
        throw new HttpException('Vidéo non trouvée', HttpStatus.NOT_FOUND);
      }

      return video;
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération de la vidéo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveVideoToPost(videoId: string, postId: string): Promise<Video> {
    try {
      const video = await this.videoModel.findByIdAndUpdate(
        videoId,
        {
          usedInPost: true,
          postId,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!video) {
        throw new HttpException('Vidéo non trouvée', HttpStatus.NOT_FOUND);
      }

      return video;
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la sauvegarde de la vidéo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteVideo(videoId: string, userId: string): Promise<void> {
    try {
      const video = await this.videoModel.findById(videoId);

      if (!video) {
        throw new HttpException('Vidéo non trouvée', HttpStatus.NOT_FOUND);
      }

      if (video.userId !== userId) {
        throw new HttpException(
          'Vous n\'avez pas la permission de supprimer cette vidéo',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.videoModel.findByIdAndDelete(videoId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de la suppression de la vidéo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildSearchQuery(description: string, category?: string): string {
    let query = description;

    if (category) {
      query += ` ${category}`;
    }

    return query;
  }

  private selectVideoFile(pexelsVideo: any, duration?: string): any {
    const videoFiles = pexelsVideo.video_files || [];

    if (videoFiles.length === 0) {
      return null;
    }

    // Sélectionner le fichier en fonction de la durée demandée
    if (duration === 'short') {
      return videoFiles.find((f) => f.quality === 'hd') || videoFiles[0];
    } else if (duration === 'long') {
      return videoFiles.find((f) => f.quality === 'hd') || videoFiles[videoFiles.length - 1];
    }

    // Par défaut, prendre la meilleure qualité disponible
    return videoFiles.find((f) => f.quality === 'hd') || videoFiles[0];
  }
}

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { EditedVideo } from './schemas/edited-video.schema';
import { ProcessVideoDto, VideoTextOverlayDto, VideoMusicDto } from './dto/process-video.dto';

// Configuration FFmpeg
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

@Injectable()
export class VideoEditorService {
  constructor(@InjectModel(EditedVideo.name) private editedVideoModel: Model<EditedVideo>) {}

  async processEditedVideo(userId: string, dto: ProcessVideoDto): Promise<EditedVideo> {
    try {
      console.log('🎬 [VideoEditor] Processing video...');
      console.log('🎬 [VideoEditor] Original path:', dto.videoPath);

      // 1. Vérifier que le fichier existe
      if (!fs.existsSync(dto.videoPath)) {
        throw new HttpException('Fichier vidéo non trouvé', HttpStatus.NOT_FOUND);
      }

      // 2. Obtenir les métadonnées de la vidéo originale
      const metadata = await this.getVideoMetadata(dto.videoPath);
      const originalDuration = metadata.duration;

      // 3. Générer le chemin de sortie
      const outputPath = await this.generateOutputPath();

      // 4. Traitement vidéo avec FFmpeg
      const editedVideoPath = await this.processWithFFmpeg(dto, outputPath);

      // 5. Obtenir la durée de la vidéo éditée
      const editedMetadata = await this.getVideoMetadata(editedVideoPath);
      const editedDuration = editedMetadata.duration;

      // 6. Créer l'entrée en base de données
      const editedVideo = new this.editedVideoModel({
        userId,
        originalVideoPath: dto.videoPath,
        editedVideoPath,
        music: dto.music,
        textOverlays: dto.textOverlays || [],
        subtitles: dto.subtitles || [],
        trimStart: dto.trimStart,
        trimEnd: dto.trimEnd,
        transitions: dto.transitions || [],
        originalDuration,
        editedDuration,
      });

      const savedVideo = await editedVideo.save();

      console.log('✅ [VideoEditor] Video processed:', savedVideo._id);
      console.log('✅ [VideoEditor] Output path:', editedVideoPath);

      return savedVideo;
    } catch (error) {
      console.error('❌ [VideoEditor] Error:', error.message);
      throw new HttpException(
        error.message || 'Erreur lors du traitement de la vidéo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addBackgroundMusic(userId: string, videoPath: string, music: VideoMusicDto): Promise<string> {
    try {
      console.log('🎵 [VideoEditor] Adding background music...');

      const outputPath = await this.generateOutputPath();

      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .input(music.path)
          .complexFilter([
            `[1:a]volume=${music.volume || 0.5}[music]`,
            '[0:a][music]amix=inputs=2:duration=first[a]'
          ])
          .outputOptions(['-map', '0:v', '-map', '[a]'])
          .output(outputPath)
          .on('end', () => {
            console.log('✅ [VideoEditor] Music added successfully');
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('❌ [VideoEditor] Music error:', error.message);
            reject(error);
          })
          .run();
      });
    } catch (error) {
      throw new HttpException(
        'Erreur lors de l\'ajout de musique',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async trimVideo(userId: string, videoPath: string, startTime: number, endTime: number): Promise<string> {
    try {
      console.log('✂️ [VideoEditor] Trimming video...');
      console.log('✂️ [VideoEditor] Start:', startTime, 'End:', endTime);

      const outputPath = await this.generateOutputPath();
      const duration = endTime - startTime;

      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(startTime)
          .duration(duration)
          .output(outputPath)
          .on('end', () => {
            console.log('✅ [VideoEditor] Video trimmed successfully');
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('❌ [VideoEditor] Trim error:', error.message);
            reject(error);
          })
          .run();
      });
    } catch (error) {
      throw new HttpException(
        'Erreur lors du découpage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getHistory(userId: string, limit: number = 20, skip: number = 0): Promise<{ videos: EditedVideo[]; total: number }> {
    try {
      const videos = await this.editedVideoModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();

      const total = await this.editedVideoModel.countDocuments({ userId });

      return { videos, total };
    } catch (error) {
      throw new HttpException(
        'Erreur lors de la récupération de l\'historique',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMusicLibrary(): Promise<any[]> {
    // Bibliothèque de musiques prédéfinies
    return [
      {
        id: 'upbeat1',
        name: 'Upbeat Energy',
        duration: 120,
        genre: 'Electronic',
        mood: 'Energetic',
        path: '/music/upbeat-energy.mp3',
      },
      {
        id: 'chill1',
        name: 'Chill Vibes',
        duration: 180,
        genre: 'Ambient',
        mood: 'Relaxed',
        path: '/music/chill-vibes.mp3',
      },
      {
        id: 'corporate1',
        name: 'Corporate Success',
        duration: 150,
        genre: 'Corporate',
        mood: 'Professional',
        path: '/music/corporate-success.mp3',
      },
      {
        id: 'acoustic1',
        name: 'Acoustic Guitar',
        duration: 200,
        genre: 'Acoustic',
        mood: 'Warm',
        path: '/music/acoustic-guitar.mp3',
      },
      {
        id: 'electronic1',
        name: 'Electronic Beat',
        duration: 140,
        genre: 'Electronic',
        mood: 'Modern',
        path: '/music/electronic-beat.mp3',
      },
    ];
  }

  private async processWithFFmpeg(dto: ProcessVideoDto, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(dto.videoPath);

      // 1. Découpage si nécessaire
      if (dto.trimStart !== undefined && dto.trimEnd !== undefined) {
        const duration = dto.trimEnd - dto.trimStart;
        command = command.seekInput(dto.trimStart).duration(duration);
      }

      // 2. Ajout de musique de fond
      if (dto.music) {
        command = command
          .input(dto.music.path)
          .complexFilter([
            `[1:a]volume=${dto.music.volume || 0.5}[music]`,
            '[0:a][music]amix=inputs=2:duration=first[a]'
          ])
          .outputOptions(['-map', '0:v', '-map', '[a]']);
      }

      // 3. Ajout de texte avec timing
      if (dto.textOverlays && dto.textOverlays.length > 0) {
        const textFilters = dto.textOverlays.map((overlay) => {
          const color = `#${overlay.color.toString(16).padStart(6, '0')}`;
          const fontWeight = overlay.bold ? 'Bold' : 'Normal';
          const fontStyle = overlay.italic ? 'Italic' : 'Normal';
          
          return `drawtext=text='${overlay.text}':x=${overlay.x}*w:y=${overlay.y}*h:fontsize=${overlay.fontSize}:fontcolor=${color}:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
        });

        command = command.videoFilters(textFilters);
      }

      // 4. Ajout de sous-titres
      if (dto.subtitles && dto.subtitles.length > 0) {
        const subtitleFilters = dto.subtitles.map((subtitle) => {
          const color = `#${(subtitle.color || 0xFFFFFF).toString(16).padStart(6, '0')}`;
          const fontSize = subtitle.fontSize || 24;
          
          return `drawtext=text='${subtitle.text}':x=(w-text_w)/2:y=h-${fontSize * 2}:fontsize=${fontSize}:fontcolor=${color}:enable='between(t,${subtitle.startTime},${subtitle.endTime})'`;
        });

        const existingFilters = command._videoFilters || [];
        command = command.videoFilters([...existingFilters, ...subtitleFilters]);
      }

      // 5. Configuration de sortie
      command
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .format('mp4')
        .on('progress', (progress) => {
          console.log(`🎬 [VideoEditor] Processing: ${Math.round(progress.percent || 0)}%`);
        })
        .on('end', () => {
          console.log('✅ [VideoEditor] FFmpeg processing completed');
          resolve(outputPath);
        })
        .on('error', (error) => {
          console.error('❌ [VideoEditor] FFmpeg error:', error.message);
          reject(error);
        })
        .run();
    });
  }

  private async getVideoMetadata(videoPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (error, metadata) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            duration: metadata.format.duration,
            width: metadata.streams[0].width,
            height: metadata.streams[0].height,
            bitrate: metadata.format.bit_rate,
          });
        }
      });
    });
  }

  private async generateOutputPath(): Promise<string> {
    // Créer le dossier s'il n'existe pas
    const outputDir = path.join(process.cwd(), 'uploads', 'edited-videos');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const filename = `edited_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
    return path.join(outputDir, filename);
  }

  async deleteEditedVideo(videoId: string, userId: string): Promise<void> {
    try {
      const video = await this.editedVideoModel.findById(videoId);

      if (!video) {
        throw new HttpException('Vidéo non trouvée', HttpStatus.NOT_FOUND);
      }

      if (video.userId !== userId) {
        throw new HttpException(
          'Vous n\'avez pas la permission de supprimer cette vidéo',
          HttpStatus.FORBIDDEN,
        );
      }

      // Supprimer le fichier physique
      if (video.editedVideoPath && fs.existsSync(video.editedVideoPath)) {
        fs.unlinkSync(video.editedVideoPath);
      }

      // Supprimer de la base de données
      await this.editedVideoModel.findByIdAndDelete(videoId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Erreur lors de la suppression de la vidéo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
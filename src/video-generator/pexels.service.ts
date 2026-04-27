import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PexelsService {
    private readonly apiKey: string | undefined;
    private readonly baseUrl = 'https://api.pexels.com/videos';

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('PEXELS_API_KEY');
    }

    async searchVideos(query: string, orientation?: string, size?: string) {
        if (!this.apiKey) {
            console.warn('[PexelsService] PEXELS_API_KEY not found in environment');
            return null;
        }

        try {
            const params: any = {
                query,
                per_page: 1,
            };

            if (orientation) params.orientation = orientation;
            if (size) params.size = size;

            const response = await axios.get(`${this.baseUrl}/search`, {
                headers: {
                    Authorization: this.apiKey,
                },
                params,
            });

            if (response.data.videos && response.data.videos.length > 0) {
                const video = response.data.videos[0];
                // Return in a format compatible with the frontend Video model
                return {
                    id: video.id.toString(),
                    videoUrl: video.video_files[0]?.link,
                    thumbnailUrl: video.image,
                    duration: video.duration,
                    width: video.width,
                    height: video.height,
                    user: video.user.name,
                    userUrl: video.user.url,
                    source: 'pexels',
                };
            }

            return null;
        } catch (error) {
            console.error('[PexelsService] Error searching videos:', error.response?.data || error.message);
            throw error;
        }
    }
}

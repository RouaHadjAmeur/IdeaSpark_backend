import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { extname } from 'path';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PublishInstagramDto } from './dto/publish-instagram.dto';
import { PublishInstagramUploadDto } from './dto/publish-instagram-upload.dto';
import { StartInstagramOauthDto } from './dto/start-instagram-oauth.dto';
import { InstagramAuthService } from './instagram-auth.service';
import { TrendingAudioService } from './trending-audio.service';

const ONE_GB = 1024 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
  '.avi',
  '.mkv',
  '.3gp',
  '.mpeg',
  '.mpg',
]);

@ApiTags('Instagram Publishing')
@Controller('instagram-auth')
export class InstagramAuthController {
  constructor(
    private readonly instagramAuthService: InstagramAuthService,
    private readonly trendingAudioService: TrendingAudioService,
  ) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Instagram OAuth URL' })
  async startOauth(
    @CurrentUser() user: any,
    @Body() body: StartInstagramOauthDto,
  ): Promise<{ authUrl: string; state: string; expiresAt: string }> {
    const userId = user.id || user._id?.toString();
    return this.instagramAuthService.createOauthStart(userId, body.appRedirectUri);
  }

  @Get('callback')
  @ApiOperation({ summary: 'OAuth callback endpoint used by Meta' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<{ success: true; redirectUrl?: string }> {
    return this.instagramAuthService.handleOauthCallback(code, state);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get connected Instagram account for current user' })
  async getCurrentConnection(@CurrentUser() user: any) {
    const userId = user.id || user._id?.toString();
    return this.instagramAuthService.getCurrentConnection(userId);
  }

  @Get('insights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get high-level insights for connected Instagram account' })
  async getInsights(@CurrentUser() user: any) {
    const userId = user.id || user._id?.toString();
    return this.instagramAuthService.getInsights(userId);
  }

  @Get('insights/views')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed views analytics' })
  async getViewsDetails(@CurrentUser() user: any) {
    const userId = user.id || user._id?.toString();
    return this.instagramAuthService.getViewsDetails(userId);
  }

  @Get('insights/interactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed interactions analytics' })
  async getInteractionsDetails(@CurrentUser() user: any) {
    const userId = user.id || user._id?.toString();
    return this.instagramAuthService.getInteractionsDetails(userId);
  }

  @Get('insights/followers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed followers analytics' })
  async getFollowersDetails(@CurrentUser() user: any) {
    const userId = user.id || user._id?.toString();
    return this.instagramAuthService.getFollowersDetails(userId);
  }

  @Get('insights/trending-audio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trending audio list' })
  async getTrendingAudio() {
    return this.trendingAudioService.getTrendingAudio();
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Instagram account for current user' })
  async disconnect(@CurrentUser() user: any): Promise<{ success: true }> {
    const userId = user.id || user._id?.toString();
    await this.instagramAuthService.disconnect(userId);
    return { success: true };
  }

  @Post('publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish Reel or Feed media to connected Instagram account from public URL' })
  async publish(
    @CurrentUser() user: any,
    @Body() body: PublishInstagramDto,
  ): Promise<{ success: true; mediaId: string; permalink?: string }> {
    const userId = user.id || user._id?.toString();
    return this.instagramAuthService.publishFromUrl(userId, body);
  }

  @Post('publish-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('media', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, tmpdir()),
        filename: (_req, file, cb) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `ig-upload-${suffix}${extname(file.originalname || '.mp4')}`);
        },
      }),
      limits: { fileSize: ONE_GB },
      fileFilter: (_req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase();
        const extension = extname(file.originalname || '').toLowerCase();
        const isImageMime = mime.startsWith('image/');
        const isVideoMime = mime.startsWith('video/');
        const isGenericMime = mime === 'application/octet-stream' || mime === '';

        if (isImageMime || isVideoMime) {
          cb(null, true);
          return;
        }

        if (
          isGenericMime
          && (ALLOWED_IMAGE_EXTENSIONS.has(extension) || ALLOWED_VIDEO_EXTENSIONS.has(extension))
        ) {
          cb(null, true);
          return;
        }

        cb(new BadRequestException('Only image and video files are allowed') as any, false);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['media', 'mediaType'],
      properties: {
        media: { type: 'string', format: 'binary' },
        mediaType: { type: 'string', enum: ['image', 'video', 'reel'], example: 'reel' },
        caption: { type: 'string', maxLength: 2200 },
        shareToFeed: { type: 'boolean', example: true },
      },
    },
  })
  @ApiOperation({ summary: 'Publish Reel or Feed media to connected Instagram account from uploaded phone file (max 1GB)' })
  async publishUpload(
    @CurrentUser() user: any,
    @Body() body: PublishInstagramUploadDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: true; mediaId: string; permalink?: string; mediaUrl?: string }> {
    const userId = user.id || user._id?.toString();
    if (!file) {
      throw new BadRequestException('Media file is required');
    }
    return this.instagramAuthService.publishFromUploadedFile(userId, body, file);
  }
}


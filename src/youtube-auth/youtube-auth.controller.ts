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
import { PublishYoutubeDto } from './dto/publish-youtube.dto';
import { PublishYoutubeUploadDto } from './dto/publish-youtube-upload.dto';
import { StartYoutubeOauthDto } from './dto/start-youtube-oauth.dto';
import { YoutubeAuthService } from './youtube-auth.service';

const ONE_GB = 1024 * 1024 * 1024;
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

@ApiTags('YouTube Publishing')
@Controller('youtube-auth')
export class YoutubeAuthController {
  constructor(private readonly youtubeAuthService: YoutubeAuthService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create YouTube OAuth URL (PKCE)' })
  async startOauth(
    @CurrentUser() user: any,
    @Body() body: StartYoutubeOauthDto,
  ): Promise<{ authUrl: string; state: string; expiresAt: string }> {
    const userId = user.id || user._id?.toString();
    return this.youtubeAuthService.createOauthStart(userId, body.appRedirectUri);
  }
  @Get('callback')
  @ApiOperation({ summary: 'OAuth callback endpoint used by Google' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<{ success: true; redirectUrl?: string }> {
    return this.youtubeAuthService.handleOauthCallback(code, state);
  }
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get connected YouTube account for current user' })
  async getCurrentConnection(@CurrentUser() user: any) {
    const userId = user.id || user._id?.toString();
    return this.youtubeAuthService.getCurrentConnection(userId);
  }
  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect YouTube account for current user' })
  async disconnect(@CurrentUser() user: any): Promise<{ success: true }> {
    const userId = user.id || user._id?.toString();
    await this.youtubeAuthService.disconnect(userId);
    return { success: true };
  }
  @Post('publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish video to connected YouTube account from public URL' })
  async publish(
    @CurrentUser() user: any,
    @Body() body: PublishYoutubeDto,
  ): Promise<{ success: true; videoId: string; youtubeUrl: string }> {
    const userId = user.id || user._id?.toString();
    return this.youtubeAuthService.publishFromUrl(userId, body);
  }

  @Post('publish-upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, tmpdir()),
        filename: (_req, file, cb) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `yt-upload-${suffix}${extname(file.originalname || '.mp4')}`);
        },
      }),
      limits: { fileSize: ONE_GB },
      fileFilter: (_req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase();
        const extension = extname(file.originalname || '').toLowerCase();
        const isVideoMime = mime.startsWith('video/');
        const isGenericMimeWithVideoExt =
          (mime === 'application/octet-stream' || mime === '') &&
          ALLOWED_VIDEO_EXTENSIONS.has(extension);

        if (isVideoMime || isGenericMimeWithVideoExt) {
          cb(null, true);
          return;
        }
        cb(new BadRequestException('Only video files are allowed') as any, false);
      },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['video', 'title'],
      properties: {
        video: { type: 'string', format: 'binary' },
        title: { type: 'string', maxLength: 100 },
        description: { type: 'string', maxLength: 5000 },
        tagsCsv: { type: 'string', example: 'ideaspark,ai,marketing' },
        privacyStatus: {
          type: 'string',
          enum: ['private', 'unlisted', 'public'],
          example: 'private',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Publish video to connected YouTube account from uploaded file (max 1GB)' })
  async publishUpload(
    @CurrentUser() user: any,
    @Body() body: PublishYoutubeUploadDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: true; videoId: string; youtubeUrl: string }> {
    const userId = user.id || user._id?.toString();
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    return this.youtubeAuthService.publishFromUploadedFile(userId, body, file);
  }
}

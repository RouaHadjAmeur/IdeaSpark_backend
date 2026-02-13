import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoGeneratorService } from './video-generator.service';
import { CreateVideoRequestDto } from './dto/create-video-request.dto';
import { CreateVideoIdeaDto } from './dto/create-video-idea.dto';
import { RefineVideoIdeaDto } from './dto/refine-video-idea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Video Generator')
@Controller('video-generator')
export class VideoGeneratorController {
    constructor(private readonly videoGeneratorService: VideoGeneratorService) { }

    @Post('generate')
    @UseInterceptors(FileInterceptor('productImage', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new Error('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }))
    @ApiConsumes('multipart/form-data')
    // @UseGuards(JwtAuthGuard) // COMMENTED OUT FOR DEVELOPMENT TESTING
    // @ApiBearerAuth()
    @ApiOperation({
        summary: 'Generate AI-powered video ideas (OpenAI)',
        description: 'Generate creative video scripts using GPT-4o-mini. Supports optional product image vision analysis. The AI will automatically use your persona profile to personalize the content.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productImage: {
                    type: 'string',
                    format: 'binary',
                    description: 'Optional product image for vision analysis',
                },
                // Include fields from CreateVideoRequestDto for Swagger documentation
                platform: { type: 'string', enum: ['TikTok', 'InstagramReels', 'YouTubeShorts'] },
                duration: { type: 'string', enum: ['15s', '30s', '60s'] },
                goal: { type: 'string' },
                creatorType: { type: 'string' },
                tone: { type: 'string', enum: ['Trendy', 'Professional', 'Emotional', 'Funny', 'Luxury', 'DirectResponse'] },
                language: { type: 'string', enum: ['English', 'French', 'Arabic'] },
                productName: { type: 'string' },
                productCategory: { type: 'string' },
                keyBenefits: { type: 'array', items: { type: 'string' } },
                targetAudience: { type: 'string' },
                painPoint: { type: 'string' },
                offer: { type: 'string' },
                price: { type: 'string' },
                batchSize: { type: 'number', default: 1 },
            },
            required: ['platform', 'duration', 'goal', 'creatorType', 'tone', 'language', 'productName', 'productCategory', 'keyBenefits', 'targetAudience'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Video ideas generated successfully',
        schema: {
            example: [
                {
                    title: 'Video Idea: Stop scrolling if you want better hydration!',
                    hook: 'Stop scrolling if you want better hydration!',
                    script: '(0-3s) ARoll: Stop scrolling if you want better hydration!\n\n(3-10s) BRoll: You know how annoying forgetting to drink water is?\n\n(10-26s) ProductCloseUp: Well, Smart Water Bottle fixes that by tracking hydration...',
                    scenes: [
                        {
                            startSec: 0,
                            endSec: 3,
                            shotType: 'ARoll',
                            description: 'Hook opening',
                            onScreenText: 'Better Hydration',
                            voiceOver: 'Stop scrolling if you want better hydration!',
                        },
                    ],
                    cta: 'Link in bio!',
                    caption: 'Check out Smart Water Bottle! Perfect for fitness enthusiasts.',
                    hashtags: ['#SmartWaterBottle', '#HealthFitness', '#fyp', '#viral'],
                    thumbnailText: 'Stop scrolling if yo',
                    filmingNotes: 'Ensure good lighting and clear audio.',
                    complianceNote: 'Ensure all claims are accurate.',
                    suggestedLocations: ['Modern gym', 'Outdoor park', 'Kitchen counter'],
                    locationHooks: [
                        { location: 'Gym', hook: 'POV: You are smashing your workout but forgot your water...' }
                    ],
                    createdAt: '2026-02-10T21:00:00.000Z',
                },
            ],
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - JWT token required',
    })
    generate(
        @Request() req,
        @Body() createVideoRequestDto: CreateVideoRequestDto,
        @UploadedFile() productImage?: Express.Multer.File,
    ) {
        // Force batchSize to 1 for iterative refinement flow
        createVideoRequestDto.batchSize = 1;

        // Get userId if authenticated, otherwise undefined (for testing without auth)
        const userId = req.user ? (req.user.userId || req.user._id) : undefined;
        return this.videoGeneratorService.generateIdeas(createVideoRequestDto, userId, productImage?.buffer);
    }

    @Post('analyze-image')
    @UseInterceptors(FileInterceptor('productImage'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Analyze product image to pre-fill the form',
        description: 'AI analyzes the image and returns suggested values for the generation form.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productImage: { type: 'string', format: 'binary' },
            },
        },
    })
    analyzeImage(@UploadedFile() productImage: Express.Multer.File) {
        if (!productImage) throw new Error('Product image is required');
        return this.videoGeneratorService.analyzeImage(productImage.buffer);
    }

    @Post('refine')
    @ApiOperation({
        summary: 'Refine a video idea (Chat-like)',
        description: 'Apply instructions to refine an existing idea. Limited to 3 attempts.',
    })
    refine(@Request() req, @Body() refineDto: RefineVideoIdeaDto) {
        const userId = req.user ? (req.user.userId || req.user._id) : undefined;
        const instruction = refineDto.customInstruction || refineDto.refinementType || 'Optimize the script';
        return this.videoGeneratorService.refineIdea(refineDto.ideaId, instruction, userId);
    }

    @Post('approve')
    @ApiOperation({ summary: 'Approve a specific version of a video idea' })
    approve(@Body('ideaId') ideaId: string, @Body('versionIndex') versionIndex: number) {
        return this.videoGeneratorService.approveVersion(ideaId, versionIndex);
    }

    @Post('save')
    @ApiOperation({
        summary: 'Save a video idea',
        description: 'Save a generated video idea to the database for future reference.',
    })
    @ApiBody({
        type: CreateVideoIdeaDto,
        description: 'Video idea data to save',
    })
    @ApiResponse({
        status: 201,
        description: 'Video idea saved successfully',
    })
    save(@Request() req, @Body() createVideoIdeaDto: any) {
        const userId = req.user ? (req.user.userId || req.user._id) : undefined;
        return this.videoGeneratorService.saveIdea(createVideoIdeaDto, userId);
    }

    @Get('history')
    @ApiOperation({
        summary: 'Get generation history',
        description: 'Retrieve all generated video ideas (history). Every generated idea is automatically saved here.',
    })
    @ApiResponse({ status: 200, description: 'List of all generated video ideas' })
    getHistory(@Request() req) {
        const userId = req.user ? (req.user.userId || req.user._id) : undefined;
        return this.videoGeneratorService.getHistory(userId);
    }

    @Get('favorites')
    @ApiOperation({
        summary: 'Get favorite video ideas',
        description: 'Retrieve only the video ideas marked as favorites (saved or approved).',
    })
    @ApiResponse({ status: 200, description: 'List of favorite video ideas' })
    getFavorites(@Request() req) {
        const userId = req.user ? (req.user.userId || req.user._id) : undefined;
        return this.videoGeneratorService.getFavorites(userId);
    }

    @Post('toggle-favorite/:id')
    @ApiOperation({
        summary: 'Toggle favorite status',
        description: 'Toggle a video idea between favorite and non-favorite.',
    })
    @ApiResponse({ status: 200, description: 'Favorite status toggled' })
    toggleFavorite(@Param('id') id: string) {
        return this.videoGeneratorService.toggleFavorite(id);
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a video idea',
        description: 'Permanently delete a video idea from history.',
    })
    @ApiResponse({ status: 200, description: 'Video idea deleted' })
    deleteIdea(@Param('id') id: string) {
        return this.videoGeneratorService.deleteIdea(id);
    }
}

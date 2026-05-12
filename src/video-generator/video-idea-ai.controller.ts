import { Controller, Post, Get, Delete, Body, Param, Request, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VideoIdeaAiService } from './video-idea-ai.service';
import { VideoGeneratorService } from './video-generator.service';
import { GenerateVideoIdeaDto } from './dto/generate-video-idea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI — Video Ideas')
@Controller('ai/video-ideas')
@UseGuards(JwtAuthGuard)
export class VideoIdeaAiController {
    constructor(
        private readonly svc: VideoIdeaAiService,
        private readonly svcPersistence: VideoGeneratorService
    ) { }

    @Post('generate')
    @ApiOperation({
        summary: 'Generate a ContentBlock-compatible video idea',
        description: `Accepts brand context (tone, audience, content pillars), plan context (phase, week, promo ratio)
and returns a structured video idea ready to be saved as a ContentBlock via POST /content-blocks.

Does NOT auto-save — call POST /content-blocks to persist.`,
    })
    @ApiResponse({
        status: 200,
        description: 'Generated video idea as ContentBlock fields',
        schema: {
            example: {
                title: 'How Fitness Coaches Use Smart Water Bottles to 2× Client Results',
                hooks: [
                    'If you\'re a fitness coach and you\'re NOT tracking hydration — watch this.',
                    'The #1 thing missing from your client\'s routine (hint: it\'s not more reps)',
                    'Science says 60% of athletes are mildly dehydrated. Here\'s the fix.',
                ],
                scriptOutline: '1. Hook: Coach discovers clients skip water\n2. Problem: Dehydration kills performance\n3. Solution: Smart Water Bottle with LED reminders\n4. Demo: Coach shows app sync\n5. CTA: Link in bio for 15% off',
                contentType: 'educational',
                ctaType: 'soft',
                platform: 'instagram',
                format: 'reel',
                description: 'Educational reel positioning the product as a coaching tool, emphasizing authority.',
                productSuggestion: 'Smart Water Bottle Pro',
                tags: ['#hydration', '#fitnesscoach', '#wellness'],
            },
        },
    })
    @Post('generate')
    @UseInterceptors(FileInterceptor('productImage', {
        storage: diskStorage({
            destination: './uploads/video-ideas',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    @ApiOperation({
        summary: 'Generate ContentBlock-compatible video ideas',
        description: `Accepts brand context and returns a list of structured video ideas.
        Supports multipart/form-data for optional product image analysis during generation.`,
    })
    @ApiConsumes('multipart/form-data', 'application/json')
    @ApiResponse({
        status: 200,
        description: 'Generated video ideas as an array of ContentBlock fields',
    })
    async generate(
        @Request() req, 
        @Body() dto: GenerateVideoIdeaDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        // If an image is provided, we could optionally analyze it first to enrich the DTO
        // For now, we'll just pass the DTO to the service
        // Note: NestJS @Body() handles both JSON and multipart text fields
        
        // Ensure numeric fields are numbers (multipart sends them as strings)
        if (typeof dto.batchSize === 'string') dto.batchSize = parseInt(dto.batchSize, 10);
        if (typeof dto.currentWeek === 'string') dto.currentWeek = parseInt(dto.currentWeek, 10);
        if (typeof dto.promoRatio === 'string') dto.promoRatio = parseFloat(dto.promoRatio);

        return this.svc.generate(dto);
    }

    @Post('analyze-image')
    @UseInterceptors(FileInterceptor('productImage', {
        storage: diskStorage({
            destination: './uploads/video-ideas',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    @ApiOperation({
        summary: 'Analyze a product image and generate video ideas',
        description: 'Uses OpenAI vision to analyze a product image, then generates multiple video ideas based on the analysis.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productImage: { type: 'string', format: 'binary' },
                brandName: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Generated video ideas from image analysis' })
    async analyzeImage(
        @UploadedFile() file: Express.Multer.File,
        @Body('brandName') brandName: string,
        @Request() req: any
    ) {
        if (!file) {
            throw new Error('No image file uploaded');
        }

        // Construct full URL for OpenAI (it needs a reachable URL)
        // Note: For local development, this needs to be a public URL if OpenAI is to fetch it,
        // OR we should send the base64 of the image.
        // Since we are on localhost, OpenAI cannot fetch from our machine.
        // BETTER APPROACH: Convert image to base64 and send it directly.
        
        const fs = require('fs');
        const imageBase64 = fs.readFileSync(file.path, { encoding: 'base64' });
        const dataUrl = `data:${file.mimetype};base64,${imageBase64}`;

        const result = await this.svc.analyzeImage(dataUrl, brandName || 'My Brand');
        return result;
    }

    @Get('history')
    @ApiOperation({ summary: 'Get AI video ideas history' })
    getHistory(@Request() req) {
        return this.svcPersistence.getIdeaHistory(req.user.id);
    }

    @Get('favorites')
    @ApiOperation({ summary: 'Get favorite AI video ideas' })
    getFavorites(@Request() req) {
        return this.svcPersistence.getIdeaFavorites(req.user.id);
    }

    @Post('save')
    @ApiOperation({ summary: 'Save an AI video idea' })
    save(@Request() req, @Body() dto: any) {
        return this.svcPersistence.saveIdea(req.user.id, dto);
    }

    @Post(':id/favorite')
    @ApiOperation({ summary: 'Toggle favorite status' })
    toggleFavorite(@Param('id') id: string) {
        return this.svcPersistence.toggleIdeaFavorite(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an AI video idea' })
    delete(@Request() req, @Param('id') id: string) {
        return this.svcPersistence.deleteIdea(id, req.user.id);
    }
}

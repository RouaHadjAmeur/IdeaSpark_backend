import { Controller, Post, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VideoIdeaAiService } from './video-idea-ai.service';
import { GenerateVideoIdeaDto } from './dto/generate-video-idea.dto';

@ApiTags('AI — Video Ideas')
@Controller('ai/video-ideas')
export class VideoIdeaAiController {
    constructor(private readonly svc: VideoIdeaAiService) { }

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
    generate(@Request() req, @Body() dto: GenerateVideoIdeaDto) {
        return this.svc.generate(dto);
    }
}

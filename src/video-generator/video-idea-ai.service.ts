import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateVideoIdeaDto } from './dto/generate-video-idea.dto';
import {
    ContentType,
    ContentPlatform,
    ContentFormat,
    ContentCtaType,
} from '../content-blocks/schemas/content-block.schema';

export interface ContentBlockGenerationResult {
    title: string;
    hooks: string[];
    scriptOutline: string;
    contentType: ContentType;
    ctaType: ContentCtaType;
    platform: ContentPlatform;
    format: ContentFormat;
    productSuggestion?: string;
    description?: string;
    tags?: string[];
}

@Injectable()
export class VideoIdeaAiService {
    private readonly logger = new Logger(VideoIdeaAiService.name);
    private openai: OpenAI;
    private model: string;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
        this.openai = new OpenAI({ apiKey });
        this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    }

    async generate(dto: GenerateVideoIdeaDto): Promise<ContentBlockGenerationResult> {
        const systemPrompt = this.buildSystemPrompt(dto);
        const userPrompt = this.buildUserPrompt(dto);

        this.logger.log(`Generating ContentBlock video idea for product: ${dto.productName}`);

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.9,
            max_tokens: 1500,
        });

        const text = response.choices[0]?.message?.content || '';
        return this.parseResponse(text, dto);
    }

    // ─── System prompt — ContentBlock structured output ───────────────────────

    private buildSystemPrompt(dto: GenerateVideoIdeaDto): string {
        const platformCtx = dto.platform ? `Target platform: ${dto.platform}.` : '';
        const toneCtx = dto.brandTone ? `Brand tone: ${dto.brandTone}.` : '';
        const phaseCtx = dto.activePlanPhase
            ? `Current campaign phase: ${dto.activePlanPhase} (Week ${dto.currentWeek ?? '?'}).`
            : '';
        const pillarsCtx = dto.contentPillars?.length
            ? `Content pillars: ${dto.contentPillars.join(', ')}.`
            : '';
        const audienceCtx = dto.brandAudience
            ? `Target audience: ${JSON.stringify(dto.brandAudience)}.`
            : '';
        const calCtx = dto.calendarContext
            ? `Upcoming calendar context (avoid repetition): ${dto.calendarContext}`
            : '';
        const promoCtx = dto.promoRatio != null
            ? `Current promo ratio from BI: ${(dto.promoRatio * 100).toFixed(0)}%. ${dto.promoRatio > 0.4 ? 'Prefer educational/soft-cta content to balance.' : ''}`
            : '';

        return `You are an expert content strategist specializing in short-form video content for social media.
Your task is to generate ONE highly specific, actionable video idea as a structured ContentBlock JSON.

Context:
${platformCtx}
${toneCtx}
${audienceCtx}
${pillarsCtx}
${phaseCtx}
${promoCtx}
${calCtx}

RESPONSE FORMAT: Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "title": "Short, punchy content idea title (max 80 chars)",
  "hooks": [
    "Hook variation 1 — attention-grabbing opening line",
    "Hook variation 2 — alternative angle",
    "Hook variation 3 — question-based or data-driven"
  ],
  "scriptOutline": "Brief scene-by-scene outline. 3-5 bullet points describing the video flow.",
  "contentType": "one of: educational | promo | teaser | launch | social_proof | objection | behind_scenes | authority",
  "ctaType": "one of: soft | hard | educational",
  "platform": "one of: tiktok | instagram | youtube | facebook | linkedin",
  "format": "one of: reel | short | post | carousel | story | live",
  "description": "1-2 sentence brief for the creator/copywriter",
  "productSuggestion": "optional product to feature (or null)",
  "tags": ["tag1", "tag2", "tag3"]
}

Choose contentType and ctaType intelligently based on the campaign phase and brand context.
For 'launch' phase → prefer contentType: launch or teaser, ctaType: hard.
For 'tease' phase → prefer contentType: teaser or educational, ctaType: soft.
For 'retarget' phase → prefer social_proof or objection, ctaType: hard.`;
    }

    // ─── User prompt ──────────────────────────────────────────────────────────

    private buildUserPrompt(dto: GenerateVideoIdeaDto): string {
        const lang = dto.language || 'English';
        const product = dto.productName;
        const cat = dto.productCategory ? `(${dto.productCategory})` : '';
        const benefits = dto.keyBenefits?.length
            ? `Key benefits: ${dto.keyBenefits.join(', ')}.`
            : '';
        const pain = dto.painPoint ? `Pain point: ${dto.painPoint}.` : '';
        const expo = dto.productExposureSummary
            ? `Recent product exposure: ${dto.productExposureSummary}.`
            : '';

        return `Product: ${product} ${cat}
${benefits}
${pain}
${expo}
Language: ${lang}

Generate a creative, engaging ContentBlock video idea in ${lang}. Make it highly specific and immediately actionable.`;
    }

    // ─── Response parser ──────────────────────────────────────────────────────

    private parseResponse(text: string, dto: GenerateVideoIdeaDto): ContentBlockGenerationResult {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');
            const parsed = JSON.parse(jsonMatch[0]);

            return {
                title: parsed.title || `Video Idea: ${dto.productName}`,
                hooks: Array.isArray(parsed.hooks) ? parsed.hooks : [parsed.hooks || ''],
                scriptOutline: parsed.scriptOutline || '',
                contentType: this.validateEnum(parsed.contentType, ContentType, ContentType.EDUCATIONAL),
                ctaType: this.validateEnum(parsed.ctaType, ContentCtaType, ContentCtaType.SOFT),
                platform: this.validateEnum(parsed.platform, ContentPlatform, dto.platform ?? ContentPlatform.INSTAGRAM),
                format: this.validateEnum(parsed.format, ContentFormat, ContentFormat.REEL),
                description: parsed.description || null,
                productSuggestion: parsed.productSuggestion || null,
                tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            };
        } catch (err) {
            this.logger.warn(`Failed to parse AI response: ${err}`);
            return {
                title: `Video Idea: ${dto.productName}`,
                hooks: ['Stop scrolling — this might change your routine!'],
                scriptOutline: 'Hook → Problem → Solution → CTA',
                contentType: ContentType.EDUCATIONAL,
                ctaType: ContentCtaType.SOFT,
                platform: dto.platform ?? ContentPlatform.INSTAGRAM,
                format: ContentFormat.REEL,
                tags: [],
            };
        }
    }

    private validateEnum<T>(value: any, enumObj: Record<string, T>, fallback: T): T {
        const values = Object.values(enumObj) as T[];
        return values.includes(value as T) ? (value as T) : fallback;
    }
}

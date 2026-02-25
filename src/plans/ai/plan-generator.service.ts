import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    GoogleGenerativeAI,
    SchemaType,
    GenerationConfig,
} from '@google/generative-ai';
import { Plan, PlanDocument, PlanPromotionIntensity, ContentFormat, CtaType } from '../schemas/plan.schema';

// ─── AI response types ────────────────────────────────────────

export interface AIContentBlock {
    title: string;
    pillar: string;
    format: ContentFormat;
    ctaType: CtaType;
    emotionalTrigger: string;
    recommendedDayOffset: number;  // 0–6 within the week
    recommendedTime: string;       // "HH:MM"
    productId: string | null;
}

export interface AIPhase {
    name: string;
    weekNumber: number;
    description: string;
    contentBlocks: AIContentBlock[];
}

export interface AIPlanStructure {
    phases: AIPhase[];
}

// ─── Brand context (passed in from PlansService after MongoDB lookup) ─────────

export interface BrandContext {
    name: string;
    tone: string;
    contentPillars: string[];
    mainGoal?: string;
    promotionIntensity?: string;
    postingFrequency?: string;
    contentMix?: {
        educational: number;
        promotional: number;
        storytelling: number;
        authority: number;
    };
    smartRotation?: {
        maxConsecutivePromoPosts: number;
        minGapBetweenPromotions: number;
    };
    audience?: {
        ageRange?: string;
        gender?: string;
        interests?: string[];
    };
    platforms?: string[];
}

// ─── Service ─────────────────────────────────────────────────

@Injectable()
export class PlanGeneratorService {
    private readonly logger = new Logger(PlanGeneratorService.name);
    private readonly genAI: GoogleGenerativeAI;
    private readonly modelName: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Reuse the same model configured for slogan generation; default to gemini-2.0-flash
        this.modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
    }

    // ─── Public API ──────────────────────────────────────────

    async generate(plan: Plan | PlanDocument, brand: BrandContext): Promise<AIPlanStructure> {
        const prompt = this.buildPrompt(plan, brand);
        const schema  = this.buildResponseSchema();

        this.logger.log(`Generating plan structure for planId=${(plan as any)._id ?? (plan as any).id}, brand="${brand.name}" using ${this.modelName}`);

        const model = this.genAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: schema,
            } as GenerationConfig,
        });

        try {
            const result   = await model.generateContent(prompt);
            const raw      = result.response.text();
            const parsed   = JSON.parse(raw) as AIPlanStructure;

            this.validate(parsed, plan);
            return parsed;
        } catch (err) {
            this.logger.error('Gemini generation failed', err);
            throw new InternalServerErrorException('AI plan generation failed. Please try again.');
        }
    }

    // ─── Prompt builder ──────────────────────────────────────

    private buildPrompt(plan: Plan, brand: BrandContext): string {
        const mix       = plan.contentMixPreference;
        const rotation  = brand.smartRotation;
        const pillars   = brand.contentPillars?.join(', ') || 'Educational, Promotional, Storytelling';
        const interests = brand.audience?.interests?.join(', ') || 'general audience';

        const intensityGuide: Record<PlanPromotionIntensity, string> = {
            [PlanPromotionIntensity.LOW]:        'Keep promotional content minimal (max 10-15%). Focus on value and education.',
            [PlanPromotionIntensity.BALANCED]:   'Mix value-first content with moderate promotion (20-30% promo).',
            [PlanPromotionIntensity.AGGRESSIVE]: 'Drive hard conversions with strong CTAs. Up to 40% can be promotional.',
        };

        const postsPerWeek = plan.postingFrequency;
        const totalPosts   = postsPerWeek * plan.durationWeeks;

        return `
You are a world-class social media content strategist and AI planner.
Generate a complete ${plan.durationWeeks}-week strategic content plan for the brand below.

═══════════════════════════════════════
BRAND PROFILE
═══════════════════════════════════════
Brand Name:        ${brand.name}
Tone of Voice:     ${brand.tone}
Content Pillars:   ${pillars}
Main Goal:         ${brand.mainGoal ?? 'grow audience & increase sales'}
Target Audience:   ${brand.audience?.ageRange ?? 'all ages'}, ${brand.audience?.gender ?? 'all genders'} — interests: ${interests}
Platforms:         ${plan.platforms.join(', ')}

═══════════════════════════════════════
PLAN CONFIG
═══════════════════════════════════════
Objective:            ${plan.objective.replace(/_/g, ' ')}
Duration:             ${plan.durationWeeks} weeks
Posts per week:       ${postsPerWeek}
Total posts:          ~${totalPosts}
Promotion Intensity:  ${plan.promotionIntensity}
Products to feature:  ${plan.productIds.length > 0 ? plan.productIds.join(', ') : 'No specific products — brand-level content'}
Start Date:           ${plan.startDate}

═══════════════════════════════════════
CONTENT MIX TARGETS
═══════════════════════════════════════
Educational:   ${mix.educational}%
Promotional:   ${mix.promotional}%
Storytelling:  ${mix.storytelling}%
Authority:     ${mix.authority}%

═══════════════════════════════════════
PROMOTION RULES
═══════════════════════════════════════
${intensityGuide[plan.promotionIntensity]}
${rotation ? `- Never place more than ${rotation.maxConsecutivePromoPosts} promotional posts in a row.` : ''}
${rotation ? `- Ensure at least ${rotation.minGapBetweenPromotions} days gap between promotional posts.` : ''}
- Never promote the same product in two consecutive posts.
- A "hard" CTA means direct sell / buy now / link in bio.
- A "soft" CTA means follow / save / comment / share.
- An "educational" CTA means learn more / swipe to see.

═══════════════════════════════════════
PHASE STRATEGY
═══════════════════════════════════════
Structure the ${plan.durationWeeks} weeks into ${this.suggestPhaseCount(plan.durationWeeks)} phases.
Common phase names: Tease, Launch, Educate, Engage, Retarget, Close, Loyalty.
Each phase must have a distinct strategic purpose.
Week numbers must be 1-based and cover all ${plan.durationWeeks} weeks.

═══════════════════════════════════════
FORMAT VARIETY RULES
═══════════════════════════════════════
- Vary formats across posts: mix reels, carousels, stories, posts.
- Reels = high reach, best for awareness phases.
- Carousels = best for educational, authority content.
- Stories = best for soft sells, polls, behind-the-scenes.
- Posts = good for motivational, quotes, authority.

═══════════════════════════════════════
EMOTIONAL TRIGGER GUIDE
═══════════════════════════════════════
Use these triggers strategically:
curiosity, social_proof, fear_of_missing_out, aspiration, urgency,
trust_building, relatability, empowerment, exclusivity, nostalgia.

═══════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════
- Generate exactly ${postsPerWeek} content blocks per week.
- recommendedDayOffset: spread posts across 0–6 (days of the week), avoid clustering.
- recommendedTime: use audience-optimal times (e.g. "08:00", "12:00", "18:00", "20:00").
- titles must be engaging, specific, and reflect the brand tone.
- pillar must exactly match one of: ${pillars}
- productId: use one of [${plan.productIds.join(', ')}] or null.
- Return valid JSON matching the provided schema exactly.
`.trim();
    }

    // ─── Gemini response schema ──────────────────────────────

    private buildResponseSchema() {
        return {
            type: SchemaType.OBJECT,
            properties: {
                phases: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            name:        { type: SchemaType.STRING },
                            weekNumber:  { type: SchemaType.INTEGER },
                            description: { type: SchemaType.STRING },
                            contentBlocks: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        title:                { type: SchemaType.STRING },
                                        pillar:               { type: SchemaType.STRING },
                                        format:               { type: SchemaType.STRING, enum: Object.values(ContentFormat) },
                                        ctaType:              { type: SchemaType.STRING, enum: Object.values(CtaType) },
                                        emotionalTrigger:     { type: SchemaType.STRING },
                                        recommendedDayOffset: { type: SchemaType.INTEGER },
                                        recommendedTime:      { type: SchemaType.STRING },
                                        productId:            { type: SchemaType.STRING, nullable: true },
                                    },
                                    required: [
                                        'title', 'pillar', 'format', 'ctaType',
                                        'emotionalTrigger', 'recommendedDayOffset', 'recommendedTime',
                                    ],
                                },
                            },
                        },
                        required: ['name', 'weekNumber', 'description', 'contentBlocks'],
                    },
                },
            },
            required: ['phases'],
        };
    }

    // ─── Validation ──────────────────────────────────────────

    private validate(structure: AIPlanStructure, plan: Plan): void {
        if (!structure?.phases?.length) {
            throw new Error('AI returned empty phases array');
        }

        const weekNumbers = structure.phases.map((p) => p.weekNumber);
        const missingWeeks: number[] = [];
        for (let w = 1; w <= plan.durationWeeks; w++) {
            if (!weekNumbers.includes(w)) missingWeeks.push(w);
        }
        if (missingWeeks.length > 0) {
            this.logger.warn(`AI response missing weeks: ${missingWeeks.join(', ')}. Proceeding with available phases.`);
        }

        const validFormats  = new Set(Object.values(ContentFormat));
        const validCtaTypes = new Set(Object.values(CtaType));

        for (const phase of structure.phases) {
            for (const block of phase.contentBlocks) {
                if (!validFormats.has(block.format)) {
                    block.format = ContentFormat.POST; // safe fallback
                }
                if (!validCtaTypes.has(block.ctaType)) {
                    block.ctaType = CtaType.SOFT;
                }
                block.recommendedDayOffset = Math.max(0, Math.min(6, block.recommendedDayOffset));
                if (!block.productId || block.productId.trim() === '') {
                    block.productId = null;
                }
            }
        }
    }

    // ─── Helpers ─────────────────────────────────────────────

    private suggestPhaseCount(weeks: number): number {
        if (weeks <= 2)  return 1;
        if (weeks <= 4)  return 2;
        if (weeks <= 8)  return 3;
        if (weeks <= 12) return 4;
        return 5;
    }
}

// ═══════════════════════════════════════════════════════
//  EXAMPLE AI PROMPT OUTPUT (for documentation)
// ═══════════════════════════════════════════════════════

/*
Example Gemini JSON Response:
{
  "phases": [
    {
      "name": "Tease",
      "weekNumber": 1,
      "description": "Build intrigue around the upcoming launch. No hard sells — create curiosity and emotional connection.",
      "contentBlocks": [
        {
          "title": "The Story Behind Our Brand — Why We Started This Journey",
          "pillar": "Storytelling",
          "format": "reel",
          "ctaType": "soft",
          "emotionalTrigger": "curiosity",
          "recommendedDayOffset": 0,
          "recommendedTime": "18:00",
          "productId": null
        },
        {
          "title": "5 Signs You're Struggling With [Pain Point] — And What To Do",
          "pillar": "Educational",
          "format": "carousel",
          "ctaType": "educational",
          "emotionalTrigger": "relatability",
          "recommendedDayOffset": 2,
          "recommendedTime": "12:00",
          "productId": null
        },
        {
          "title": "Something Big Is Coming — Save This Post",
          "pillar": "Promotional",
          "format": "story",
          "ctaType": "soft",
          "emotionalTrigger": "fear_of_missing_out",
          "recommendedDayOffset": 4,
          "recommendedTime": "20:00",
          "productId": null
        }
      ]
    },
    {
      "name": "Launch",
      "weekNumber": 2,
      "description": "Reveal and push the product hard. Mix proof, demos, and conversion CTAs.",
      "contentBlocks": [
        {
          "title": "Introducing [Product] — The Solution You've Been Waiting For",
          "pillar": "Promotional",
          "format": "reel",
          "ctaType": "hard",
          "emotionalTrigger": "aspiration",
          "recommendedDayOffset": 0,
          "recommendedTime": "09:00",
          "productId": "prod_abc123"
        }
      ]
    }
  ]
}
*/

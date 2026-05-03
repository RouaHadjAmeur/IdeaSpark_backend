import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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
    private readonly apiKey: string;
    private readonly modelName: string;

    constructor(private readonly configService: ConfigService) {
        this.apiKey = this.configService.get<string>('HUGGING_FACE_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('HUGGING_FACE_API_KEY is not configured. Plan generation features will not work.');
        }
        this.modelName = 'Qwen/Qwen2.5-7B-Instruct'; // Using 7B model because 72B triggers HF 504 Gateway Timeout on large payloads
    }

    // ─── Public API ──────────────────────────────────────────

    async generate(plan: Plan | PlanDocument, brand: BrandContext): Promise<AIPlanStructure> {
        const prompt = this.buildPrompt(plan, brand);

        this.logger.log(`Generating plan structure for planId=${(plan as any)._id ?? (plan as any).id}, brand="${brand.name}", model=${this.modelName}, weeks=${plan.durationWeeks}, postsPerWeek=${plan.postingFrequency}`);

        if (!this.apiKey) {
            throw new InternalServerErrorException('Hugging Face API key missing');
        }

        try {
            const response = await axios.post(
                'https://router.huggingface.co/v1/chat/completions',
                {
                    model: this.modelName,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 8000,
                    temperature: 0.7,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 180000,
                }
            );

            const raw = response.data?.choices?.[0]?.message?.content;
            if (!raw) {
                throw new Error(`Unexpected response from HF: ${JSON.stringify(response.data)}`);
            }

            this.logger.log(`HF raw response length: ${raw.length} chars`);
            
            // Clean markdown JSON formatting if present
            const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            const match = cleaned.match(/\{[\s\S]*\}/);
            const jsonString = match ? match[0] : cleaned;
            
            const parsed = JSON.parse(jsonString) as AIPlanStructure;

            this.validate(parsed, plan as Plan);
            return parsed;
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = err.message;
            if (err.response?.data) {
                errorMsg = typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data;
            }
            this.logger.error(`Generation failed (model=${this.modelName}): [${status}] ${errorMsg}`);
            throw new InternalServerErrorException(`AI plan generation failed: ${errorMsg}`);
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
- Return valid JSON matching this schema exactly:
{
  "phases": [
    {
      "name": "string",
      "weekNumber": "integer (1-based)",
      "description": "string",
      "contentBlocks": [
        {
          "title": "string",
          "pillar": "string",
          "format": "string (post|story|reel|carousel|video|article)",
          "ctaType": "string (soft|hard|educational|engagement)",
          "emotionalTrigger": "string",
          "recommendedDayOffset": "integer (0-6)",
          "recommendedTime": "string (HH:MM)",
          "productId": "string or null"
        }
      ]
    }
  ]
}
Return ONLY valid JSON without markdown blocks or other text.
`.trim();
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

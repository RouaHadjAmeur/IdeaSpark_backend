import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { CreateVideoRequestDto, VideoTone, Platform } from './dto/create-video-request.dto';
import { VideoScene, ShotType } from './schemas/video-idea.schema';
import { ContentLibraries } from './content-libraries';
import { PersonaService } from '../persona/persona.service';
import { Persona } from '../persona/schemas/persona.schema';

interface LocationHook {
    location: string;
    hook: string;
}

interface GeneratedVideoIdea {
    title: string;
    hook: string;
    script: string;
    scenes: VideoScene[];
    cta: string;
    caption: string;
    hashtags: string[];
    thumbnailText: string;
    filmingNotes: string;
    complianceNote: string;
    suggestedLocations: string[];
    locationHooks: LocationHook[];
}

@Injectable()
export class OpenAIService {
    private openai: OpenAI;
    private model: string;

    constructor(
        private configService: ConfigService,
        private personaService: PersonaService,
    ) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured in environment variables');
        }
        this.openai = new OpenAI({ apiKey });
        this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    }

    async generateVideoIdeas(
        request: CreateVideoRequestDto,
        userId?: string,
        productImage?: Buffer,
    ): Promise<GeneratedVideoIdea[]> {
        const ideas: GeneratedVideoIdea[] = [];

        // Fetch user persona if userId is provided
        let persona: Persona | null = null;
        if (userId) {
            persona = await this.personaService.findByUserId(userId);
        }

        for (let i = 0; i < request.batchSize; i++) {
            try {
                const generatedIdea = await this.generateSingleVideoIdea(request, persona, productImage);
                ideas.push(generatedIdea);
            } catch (error) {
                console.error(`Error generating video idea ${i + 1}:`, error);
                const fallbackIdea = this.generateFallbackIdea(request);
                ideas.push(fallbackIdea);
            }
        }

        return ideas;
    }

    private async generateSingleVideoIdea(
        request: CreateVideoRequestDto,
        persona?: Persona | null,
        productImage?: Buffer,
    ): Promise<GeneratedVideoIdea> {
        const systemPrompt = this.getSystemPrompt(request, persona);
        const userPrompt = this.buildPrompt(request, persona);

        const messages: OpenAI.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
        ];

        if (productImage) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: userPrompt },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/jpeg;base64,${productImage.toString('base64')}`,
                        },
                    },
                    {
                        type: 'text',
                        text: 'I have also attached a product image above. Analyze this image and integrate what you see (colors, design, packaging, branding) into the video script. Suggest filming angles and scenes that showcase this specific product visually.',
                    },
                ],
            });
        } else {
            messages.push({ role: 'user', content: userPrompt });
        }

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages,
            temperature: 0.9,
            max_tokens: 2500,
        });

        const responseText = response.choices[0]?.message?.content || '';
        return this.parseAIResponse(responseText, request);
    }

    private getSystemPrompt(request: CreateVideoRequestDto, persona?: Persona | null): string {
        const languageMap = {
            English: 'English',
            French: 'French',
            Arabic: 'Tunisian Arabic (Darija)',
        };

        const toneMap = {
            Trendy: 'trendy and viral with Gen-Z appeal',
            Professional: 'professional and authoritative',
            Emotional: 'emotional and heartfelt',
            Funny: 'funny and entertaining',
            Luxury: 'luxurious and sophisticated',
            DirectResponse: 'direct and conversion-focused',
        };

        // Build persona context if available
        let personaContext = '';
        if (persona) {
            personaContext = `

CREATOR PERSONA (from their onboarding test):
You MUST tailor ALL content based on this creator's profile:
- User Type: ${persona.userType}
- Main Goal: ${persona.mainGoal}
- Niches: ${persona.niches.join(', ')}
- Main Platform: ${persona.mainPlatform}
- Frequent Platforms: ${persona.frequentPlatforms?.join(', ') || 'N/A'}
- Content Styles: ${persona.contentStyles.join(', ')}
- Preferred Tone: ${persona.preferredTone}
- Target Audiences: ${persona.audiences.join(', ')} (Age: ${persona.audienceAge})
- Preferred Language: ${persona.language}
- Preferred CTAs: ${persona.preferredCTAs.join(', ')}

IMPORTANT: Every aspect of the script (tone, vocabulary, references, filming style, locations) must be adapted to match this creator's persona. The content should feel like it was made BY this creator, FOR their specific audience.`;
        }

        return `You are an expert social media video script writer specializing in ${request.platform} content.

Your task is to create highly engaging, scroll-stopping video scripts in ${languageMap[request.language]}.
${personaContext}

Key requirements:
- Language: Write ENTIRELY in ${languageMap[request.language]}
- Platform: ${request.platform}
- Duration: ${request.duration}
- Tone: ${toneMap[request.tone]}
- Goal: ${request.goal}

The video must:
1. Start with an attention-grabbing hook (first 1-3 seconds)
2. Present a relatable problem or pain point
3. Introduce the product as the solution
4. Highlight key benefits clearly
5. End with a strong call-to-action
6. Use native ${languageMap[request.language]} expressions and slang
7. Be optimized for short-form vertical video format
${persona ? `8. Match the ${persona.contentStyles.join(' or ')} content style and ${persona.preferredTone} tone` : ''}

ADDITIONALLY, you must:
- Suggest 3 ideal filming LOCATIONS where the creator can record this video. These should be realistic, accessible places that match the product, the creator's niche${persona ? `, and their audience (${persona.audiences.join(', ')})` : ''}.
- For each suggested location, provide a unique hook/opening line that works specifically in that setting.

Response format: Return ONLY a valid JSON object (no markdown, no code blocks) with this structure:
{
  "hook": "attention-grabbing opening line",
  "scenes": [
    {
      "startSec": 0,
      "endSec": 3,
      "shotType": "ARoll|BRoll|ProductCloseUp|Testimonial|ScreenText",
      "description": "what to film",
      "onScreenText": "text overlay",
      "voiceOver": "what to say"
    }
  ],
  "cta": "call to action",
  "thumbnailText": "short catchy text for thumbnail (max 20 chars)",
  "caption": "social media caption",
  "hashtags": ["tag1", "tag2"],
  "filmingNotes": "tips for filming",
  "suggestedLocations": [
    "Location 1 with brief description",
    "Location 2 with brief description",
    "Location 3 with brief description"
  ],
  "locationHooks": [
    { "location": "Location 1", "hook": "Hook tailored for this location" },
    { "location": "Location 2", "hook": "Hook tailored for this location" },
    { "location": "Location 3", "hook": "Hook tailored for this location" }
  ]
}`;
    }

    private buildPrompt(request: CreateVideoRequestDto, persona?: Persona | null): string {
        let personaNote = '';
        if (persona) {
            personaNote = `\n\nCreator Context: This is for a ${persona.userType} in the ${persona.niches.join(', ')} niche, targeting ${persona.audiences.join(', ')} (age: ${persona.audienceAge}). Use ${persona.contentStyles.join(' or ')} style and ${persona.preferredTone} tone. The main goal is ${persona.mainGoal}. Preferred CTAs: ${persona.preferredCTAs.join(', ')}.`;
        }

        return `Create a ${request.duration} video script for:

Product: ${request.productName}
Category: ${request.productCategory}
Target Audience: ${request.targetAudience}
Key Benefits: ${request.keyBenefits.join(', ')}
${request.painPoint ? `Pain Point: ${request.painPoint}` : ''}
${request.offer ? `Special Offer: ${request.offer}` : ''}
${request.price ? `Price: ${request.price}` : ''}

Platform: ${request.platform}
Goal: ${request.goal}
Tone: ${request.tone}
${personaNote}

Generate a creative, engaging video script that feels natural and authentic for the ${request.language} speaking audience. Include 3 suggested filming locations and location-specific hooks.`;
    }

    private parseAIResponse(responseText: string, request: CreateVideoRequestDto): GeneratedVideoIdea {
        try {
            // Try to extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate and format scenes
            const scenes: VideoScene[] = (parsed.scenes || []).map((scene: any) => ({
                startSec: scene.startSec || 0,
                endSec: scene.endSec || 15,
                shotType: this.validateShotType(scene.shotType),
                description: scene.description || 'Scene description',
                onScreenText: scene.onScreenText || '',
                voiceOver: scene.voiceOver || '',
            }));

            const fullScript = scenes
                .map((s) => `(${s.startSec}-${s.endSec}s) ${s.shotType}: ${s.voiceOver}`)
                .join('\n\n');

            // Parse suggested locations
            const suggestedLocations: string[] = Array.isArray(parsed.suggestedLocations)
                ? parsed.suggestedLocations
                : [];

            // Parse location hooks
            const locationHooks: LocationHook[] = Array.isArray(parsed.locationHooks)
                ? parsed.locationHooks.map((lh: any) => ({
                    location: lh.location || '',
                    hook: lh.hook || '',
                }))
                : [];

            return {
                title: `Video Idea: ${parsed.hook?.substring(0, 50) || request.productName}`,
                hook: parsed.hook || this.getRandomHook(request),
                script: fullScript,
                scenes,
                cta: parsed.cta || this.getRandomCTA(request),
                caption: parsed.caption || this.generateCaption(request),
                hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : this.generateHashtags(request),
                thumbnailText: (parsed.thumbnailText || parsed.hook || '').substring(0, 20),
                filmingNotes: parsed.filmingNotes || 'Ensure good lighting and clear audio.',
                complianceNote: this.generateComplianceNote(request),
                suggestedLocations,
                locationHooks,
            };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return this.generateFallbackIdea(request);
        }
    }

    /**
     * Analyze product image to pre-fill the form
     */
    async analyzeProductImage(productImage: Buffer): Promise<Partial<CreateVideoRequestDto>> {
        const prompt = `Analyze this product image and suggest values for a video generation form.
Return ONLY valid JSON with these fields:
{
  "productName": "string - the product name",
  "productCategory": "string - the product category",
  "productDescription": "string - a short marketing description of the product (1-2 sentences)",
  "productDetails": "string - key specifications, features, materials, size, etc.",
  "keyBenefits": ["string1", "string2", "string3"],
  "targetAudience": "string - who would buy this",
  "painPoint": "string - the problem this product solves",
  "socialProof": "string - suggest realistic social proof like star rating, number of reviews, or a short testimonial",
  "offer": "string (optional) - suggest a compelling offer",
  "price": "string (optional) - estimate a reasonable price"
}`;

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${productImage.toString('base64')}`,
                            },
                        },
                    ],
                },
            ],
        });

        const text = response.choices[0]?.message?.content || '{}';

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
        } catch (e) {
            return {};
        }
    }

    /**
     * Refine an existing video idea based on user instructions
     */
    async refineVideoIdea(
        previousIdea: GeneratedVideoIdea,
        instructions: string,
        persona?: Persona | null,
    ): Promise<GeneratedVideoIdea> {
        const systemPrompt = `You are refining an existing video script.
Original Idea: ${JSON.stringify(previousIdea)}

User Instruction: ${instructions}

Maintain the core context but apply the changes requested.
If refining for "Emotion", make it more heartfelt.
If "Aggressive", make it high energy and fast-paced.
If "Short", condense it.
If "Story", make it a narrative.
If "Problem", focus more on the pain point.
If "Benefits", focus more on results.

Keep the same JSON structure. Return ONLY a valid JSON object (no markdown, no code blocks).`;

        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Refine the video idea based on the instructions above.' },
            ],
            temperature: 0.9,
            max_tokens: 2500,
        });

        const text = response.choices[0]?.message?.content || '';

        const dummyRequest: CreateVideoRequestDto = {
            platform: Platform.TikTok,
            duration: '30s',
            goal: 'SellProduct',
            creatorType: 'EcommerceBrand',
            tone: VideoTone.Trendy,
            language: 'English',
            productName: previousIdea.title,
            productCategory: '',
            keyBenefits: [],
            targetAudience: '',
            batchSize: 1,
        } as any;

        return this.parseAIResponse(text, dummyRequest);
    }

    private validateShotType(shotType: string): ShotType {
        const validTypes: ShotType[] = [
            ShotType.ARoll,
            ShotType.BRoll,
            ShotType.ProductCloseUp,
            ShotType.Testimonial,
            ShotType.ScreenText,
        ];

        const normalized = shotType as ShotType;
        return validTypes.includes(normalized) ? normalized : ShotType.ARoll;
    }

    private generateFallbackIdea(request: CreateVideoRequestDto): GeneratedVideoIdea {
        const hook = this.getRandomHook(request);
        const cta = this.getRandomCTA(request);
        const templateScenes = ContentLibraries.getTemplates(request.duration);

        const scenes: VideoScene[] = templateScenes.map((s) => ({
            startSec: s.startSec,
            endSec: s.endSec,
            shotType: s.shotType,
            description: s.description,
            onScreenText: this.replaceVariables(s.onScreenText, request),
            voiceOver: this.replaceVariables(s.voiceOver, request),
        }));

        const fullScript = scenes.map((s) => `(${s.startSec}-${s.endSec}s) ${s.shotType}: ${s.voiceOver}`).join('\n\n');

        return {
            title: `Video Idea: ${request.productName}`,
            hook: this.replaceVariables(hook, request),
            script: fullScript,
            scenes,
            cta: this.replaceVariables(cta, request),
            caption: this.generateCaption(request),
            hashtags: this.generateHashtags(request),
            thumbnailText: request.productName.substring(0, 20),
            filmingNotes: 'Ensure good lighting. Keep the product in focus. Speak clearly.',
            complianceNote: this.generateComplianceNote(request),
            suggestedLocations: [
                'Well-lit indoor space with clean background',
                'Outdoor area with natural lighting',
                'Home studio or workspace',
            ],
            locationHooks: [
                { location: 'Indoor space', hook: this.replaceVariables(hook, request) },
                { location: 'Outdoor', hook: this.replaceVariables(hook, request) },
                { location: 'Home studio', hook: this.replaceVariables(hook, request) },
            ],
        };
    }

    private getRandomHook(request: CreateVideoRequestDto): string {
        const hooks = ContentLibraries.HOOKS[request.language] || ContentLibraries.HOOKS.English;
        return hooks[Math.floor(Math.random() * hooks.length)];
    }

    private getRandomCTA(request: CreateVideoRequestDto): string {
        const ctas = ContentLibraries.CTAS[request.language] || ContentLibraries.CTAS.English;
        return ctas[Math.floor(Math.random() * ctas.length)];
    }

    private replaceVariables(text: string, request: CreateVideoRequestDto): string {
        return text
            .replace(/\[PRODUCT_NAME\]/g, request.productName)
            .replace(/\[PRODUCT_CATEGORY\]/g, request.productCategory)
            .replace(/\[PAIN_POINT\]/g, request.painPoint || 'this problem')
            .replace(/\[BENEFIT\]/g, request.keyBenefits[0] || 'great results')
            .replace(/\[TARGET_AUDIENCE\]/g, request.targetAudience)
            .replace(/\[OFFER\]/g, request.offer || 'a great deal')
            .replace(/\[BRAND_NAME\]/g, 'Brand');
    }

    private generateCaption(request: CreateVideoRequestDto): string {
        let base = `Check out ${request.productName}! Perfect for ${request.targetAudience}.`;
        if (request.offer) {
            base += ` ${request.offer}`;
        }
        return base;
    }

    private generateHashtags(request: CreateVideoRequestDto): string[] {
        const tags = [
            `#${request.productName.replace(/\s/g, '')}`,
            `#${request.productCategory.replace(/\s/g, '')}`,
            '#fyp',
            '#viral',
        ];

        if (request.platform === Platform.TikTok) tags.push('#tiktokmademebuyit');
        if (request.platform === Platform.InstagramReels) tags.push('#reels');

        return tags;
    }

    private generateComplianceNote(request: CreateVideoRequestDto): string {
        const cat = request.productCategory.toLowerCase();
        if (cat.includes('skin') || cat.includes('health') || cat.includes('supplement')) {
            return 'Disclaimer: Results may vary. Not medical advice.';
        }
        return 'Ensure all claims are accurate.';
    }
}

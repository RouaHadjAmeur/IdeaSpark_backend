import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VideoIdea, VideoIdeaDocument, VideoScene } from './schemas/video-idea.schema';
import { CreateVideoRequestDto, VideoTone, Platform } from './dto/create-video-request.dto';
import { ContentLibraries } from './content-libraries';
import { OpenAIService } from './openai.service';

@Injectable()
export class VideoGeneratorService {
    constructor(
        @InjectModel(VideoIdea.name) private videoIdeaModel: Model<VideoIdeaDocument>,
        private openaiService: OpenAIService,
    ) { }

    /**
     * Generate video ideas using OpenAI GPT-4o-mini (supports multimodal vision)
     * Falls back to template-based generation if AI fails
     */
    async generateIdeas(request: CreateVideoRequestDto, userId?: string, productImage?: Buffer): Promise<any[]> {
        let ideas: any[];

        try {
            // Use OpenAI to generate creative video ideas with persona context and vision analysis
            const aiGeneratedIdeas = await this.openaiService.generateVideoIdeas(request, userId, productImage);
            ideas = aiGeneratedIdeas.map(idea => ({
                ...idea,
                createdAt: new Date(),
            }));
        } catch (error) {
            console.error('OpenAI generation failed, using template fallback:', error);
            ideas = this.generateIdeasTemplate(request);
        }

        // Auto-save each generated idea to history
        const savedIdeas = await Promise.all(
            ideas.map(async (idea) => {
                const versionData = {
                    title: idea.title,
                    hook: idea.hook,
                    script: idea.script,
                    scenes: idea.scenes,
                    cta: idea.cta,
                    caption: idea.caption,
                    hashtags: idea.hashtags,
                    thumbnailText: idea.thumbnailText,
                    filmingNotes: idea.filmingNotes,
                    complianceNote: idea.complianceNote,
                    suggestedLocations: idea.suggestedLocations,
                    locationHooks: idea.locationHooks,
                    createdAt: idea.createdAt,
                };

                const savedIdea = new this.videoIdeaModel({
                    versions: [versionData],
                    currentVersionIndex: 0,
                    userId,
                    isFavorite: false,
                });

                const doc = await savedIdea.save();
                return { ...idea, _id: doc._id };
            }),
        );

        return savedIdeas;
    }

    /**
     * Template-based video idea generation (fallback method)
     * This is the original template-based approach
     */
    generateIdeasTemplate(request: CreateVideoRequestDto): any[] {
        const ideas: any[] = [];
        const availableHooks = ContentLibraries.HOOKS[request.language] || [];
        const availableCTAs = ContentLibraries.CTAS[request.language] || [];

        // Simple shuffle
        const shuffledHooks = [...availableHooks].sort(() => 0.5 - Math.random());
        const shuffledCTAs = [...availableCTAs].sort(() => 0.5 - Math.random());

        for (let i = 0; i < request.batchSize; i++) {
            const rawHook = shuffledHooks[i % shuffledHooks.length];
            const rawCTA = shuffledCTAs[i % shuffledCTAs.length];

            const templateScenes = ContentLibraries.getTemplates(request.duration);

            // Deep copy and process scenes
            const processedScenes: VideoScene[] = templateScenes.map(s => ({
                startSec: s.startSec,
                endSec: s.endSec,
                shotType: s.shotType,
                description: s.description,
                onScreenText: this.processText(s.onScreenText, request, rawHook, rawCTA),
                voiceOver: this.processText(s.voiceOver, request, rawHook, rawCTA),
            }));

            const title = `Video Idea: ${this.processSimple(rawHook, request)}`;
            const fullScript = processedScenes.map(s => `(${s.startSec}-${s.endSec}s) ${s.shotType}: ${s.voiceOver}`).join("\n\n");

            ideas.push({
                title,
                hook: this.processText(rawHook, request, rawHook, rawCTA),
                script: fullScript,
                scenes: processedScenes,
                cta: this.processText(rawCTA, request, rawHook, rawCTA),
                caption: this.generateCaption(request),
                hashtags: this.generateHashtags(request),
                thumbnailText: this.processSimple(rawHook, request).substring(0, 20) + (rawHook.length > 20 ? '...' : ''),
                filmingNotes: "Ensure good lighting. Keep the product in focus. Speak clearly.",
                complianceNote: this.generateComplianceNote(request),
                createdAt: new Date(),
            });
        }

        return ideas;
    }

    async saveIdea(createVideoIdeaDto: any, userId?: string): Promise<VideoIdea> {
        // If an _id is provided, the idea already exists in history — just mark it as favorite
        if (createVideoIdeaDto._id) {
            const existing = await this.videoIdeaModel.findById(createVideoIdeaDto._id);
            if (existing) {
                existing.isFavorite = true;
                return existing.save();
            }
        }

        // Otherwise create a new entry and mark as favorite
        const versionData = {
            title: createVideoIdeaDto.title,
            hook: createVideoIdeaDto.hook,
            script: createVideoIdeaDto.script,
            scenes: createVideoIdeaDto.scenes,
            cta: createVideoIdeaDto.cta,
            caption: createVideoIdeaDto.caption,
            hashtags: createVideoIdeaDto.hashtags,
            thumbnailText: createVideoIdeaDto.thumbnailText,
            filmingNotes: createVideoIdeaDto.filmingNotes,
            complianceNote: createVideoIdeaDto.complianceNote,
            suggestedLocations: createVideoIdeaDto.suggestedLocations,
            locationHooks: createVideoIdeaDto.locationHooks,
            createdAt: new Date(),
        };

        const createdIdea = new this.videoIdeaModel({
            versions: [versionData],
            currentVersionIndex: 0,
            productImageUrl: createVideoIdeaDto.productImageUrl,
            userId,
            isFavorite: true,
        });

        return createdIdea.save();
    }

    async analyzeImage(productImage: Buffer): Promise<any> {
        return this.openaiService.analyzeProductImage(productImage);
    }

    async refineIdea(ideaId: string, instructions: string, userId?: string): Promise<VideoIdea> {
        if (!Types.ObjectId.isValid(ideaId)) {
            throw new BadRequestException('ideaId must be a valid MongoDB ObjectId');
        }
        const idea = await this.videoIdeaModel.findById(ideaId);
        if (!idea) {
            throw new NotFoundException('Video idea not found');
        }

        if (idea.versions.length >= 4) { // Original + 3 tries
            throw new Error('Maximum refinement attempts reached (3 tries only)');
        }

        const currentVersion = idea.versions[idea.currentVersionIndex];

        // Convert VideoVersion back to GeneratedVideoIdea for the AI service
        const previousIdeaData = {
            title: currentVersion.title,
            hook: currentVersion.hook,
            script: currentVersion.script,
            scenes: currentVersion.scenes,
            cta: currentVersion.cta,
            caption: currentVersion.caption,
            hashtags: currentVersion.hashtags,
            thumbnailText: currentVersion.thumbnailText,
            filmingNotes: currentVersion.filmingNotes,
            complianceNote: currentVersion.complianceNote,
            suggestedLocations: currentVersion.suggestedLocations,
            locationHooks: currentVersion.locationHooks,
        };

        const refinedIdea = await this.openaiService.refineVideoIdea(previousIdeaData as any, instructions);

        const newVersionData = {
            ...refinedIdea,
            refinementInstruction: instructions,
            createdAt: new Date(),
        };

        idea.versions.push(newVersionData as any);
        idea.currentVersionIndex = idea.versions.length - 1;

        return idea.save();
    }

    async approveVersion(ideaId: string, versionIndex: number): Promise<VideoIdea> {
        if (!Types.ObjectId.isValid(ideaId)) {
            throw new BadRequestException('ideaId must be a valid MongoDB ObjectId');
        }
        const idea = await this.videoIdeaModel.findById(ideaId);
        if (!idea) throw new NotFoundException('Video idea not found');

        idea.currentVersionIndex = versionIndex;
        idea.isApproved = true;
        idea.isFavorite = true;
        return idea.save();
    }

    async getHistory(userId?: string): Promise<VideoIdea[]> {
        const filter = userId ? { userId } : {};
        return this.videoIdeaModel.find(filter).sort({ createdAt: -1 }).exec();
    }

    async getFavorites(userId?: string): Promise<VideoIdea[]> {
        const filter: any = { isFavorite: true };
        if (userId) filter.userId = userId;
        return this.videoIdeaModel.find(filter).sort({ createdAt: -1 }).exec();
    }

    async toggleFavorite(ideaId: string): Promise<VideoIdea> {
        if (!Types.ObjectId.isValid(ideaId)) {
            throw new BadRequestException('ideaId must be a valid MongoDB ObjectId');
        }
        const idea = await this.videoIdeaModel.findById(ideaId);
        if (!idea) throw new NotFoundException('Video idea not found');

        idea.isFavorite = !idea.isFavorite;
        return idea.save();
    }

    async deleteIdea(ideaId: string): Promise<void> {
        if (!Types.ObjectId.isValid(ideaId)) {
            throw new BadRequestException('ideaId must be a valid MongoDB ObjectId');
        }
        const idea = await this.videoIdeaModel.findByIdAndDelete(ideaId);
        if (!idea) throw new NotFoundException('Video idea not found');
    }

    private processText(template: string, request: CreateVideoRequestDto, hook: string, cta: string): string {
        let text = template;

        // Core replacements
        text = text.replace(/\[PRODUCT_NAME\]/g, request.productName);
        text = text.replace(/\[PRODUCT_CATEGORY\]/g, request.productCategory);
        text = text.replace(/\[PAIN_POINT\]/g, request.painPoint || "this problem");
        text = text.replace(/\[BENEFIT\]/g, (request.keyBenefits && request.keyBenefits.length > 0) ? request.keyBenefits[0] : "great results");
        text = text.replace(/\[TARGET_AUDIENCE\]/g, request.targetAudience);
        text = text.replace(/\[OFFER\]/g, request.offer || "a great deal");
        text = text.replace(/\[BRAND_NAME\]/g, "Brand");

        // Dynamic parts
        const processedHook = this.processSimple(hook, request);
        const processedCTA = this.processSimple(cta, request);

        text = text.replace(/\[HOOK\]/g, processedHook);
        text = text.replace(/\[HOOK_TEXT\]/g, processedHook);
        text = text.replace(/\[CTA\]/g, processedCTA);
        text = text.replace(/\[CTA_TEXT\]/g, processedCTA);

        // Multi-benefits
        if (request.keyBenefits && request.keyBenefits.length > 0) {
            text = text.replace(/\[BENEFIT_1\]/g, request.keyBenefits[0]);
            if (request.keyBenefits.length > 1) {
                text = text.replace(/\[BENEFIT_2\]/g, request.keyBenefits[1]);
            } else {
                text = text.replace(/\[BENEFIT_2\]/g, "more");
            }
        }

        return this.applyTone(text, request.tone);
    }

    private processSimple(text: string, request: CreateVideoRequestDto): string {
        let t = text;
        t = t.replace(/\[PRODUCT_NAME\]/g, request.productName);
        t = t.replace(/\[PRODUCT_CATEGORY\]/g, request.productCategory);
        t = t.replace(/\[PAIN_POINT\]/g, request.painPoint || "this problem");
        t = t.replace(/\[BENEFIT\]/g, (request.keyBenefits && request.keyBenefits.length > 0) ? request.keyBenefits[0] : "great results");
        t = t.replace(/\[TARGET_AUDIENCE\]/g, request.targetAudience);
        t = t.replace(/\[OFFER\]/g, request.offer || "a great deal");
        return t;
    }

    private applyTone(text: string, tone: VideoTone): string {
        switch (tone) {
            case VideoTone.Trendy:
                return text.includes("🔥") ? text : `${text} 🔥`;
            case VideoTone.Funny:
                return text.includes("😂") ? text : `${text} 😂`;
            case VideoTone.Luxury:
                return text.replace(/great/g, "exquisite").replace(/good/g, "premium");
            case VideoTone.Emotional:
                // simplistic
                return text;
            default:
                return text;
        }
    }

    private generateCaption(request: CreateVideoRequestDto): string {
        let base = `Check out ${request.productName}! It's perfect for ${request.targetAudience}.`;
        if (request.offer) {
            base += ` Grab it now and get ${request.offer}.`;
        }
        return base;
    }

    private generateHashtags(request: CreateVideoRequestDto): string[] {
        const tags = [
            `#${request.productName.replace(/\s/g, '')}`,
            `#${request.productCategory.replace(/\s/g, '')}`,
            "#fyp",
            "#trending"
        ];
        if (request.platform === Platform.TikTok) tags.push("#tiktokmademebuyit");
        if (request.platform === Platform.InstagramReels) tags.push("#reelsinstagram");
        return tags;
    }

    private generateComplianceNote(request: CreateVideoRequestDto): string {
        const cat = request.productCategory.toLowerCase();
        if (cat.includes("skin") || cat.includes("health") || cat.includes("supplement")) {
            return "Disclaimer: Results may vary. Not medical advice.";
        }
        return "Ensure all claims are accurate.";
    }
}

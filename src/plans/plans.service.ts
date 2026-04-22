import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
    Plan,
    PlanDocument,
    PlanStatus,
    ContentBlockStatus,
} from './schemas/plan.schema';
import { CalendarEntry, CalendarEntryDocument, CalendarEntryStatus } from './schemas/calendar-entry.schema';
import { Brand, BrandDocument } from '../brands/schemas/brand.schema';

import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateCampaignCopyDto } from './dto/update-campaign-copy.dto';
import { PlanGeneratorService, BrandContext } from './ai/plan-generator.service';
import { CtaType } from './schemas/plan.schema';
import { CollaborationService } from '../collaboration/collaboration.service';
import { AIProjectService } from './ai/ai-project.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PlansService {
    private readonly logger = new Logger(PlansService.name);

    constructor(
        @InjectModel(Plan.name)
        private readonly planModel: Model<PlanDocument>,

        @InjectModel(CalendarEntry.name)
        private readonly calendarModel: Model<CalendarEntryDocument>,

        @InjectModel(Brand.name)
        private readonly brandModel: Model<BrandDocument>,

        private readonly planGenerator: PlanGeneratorService,
        private readonly aiProjectService: AIProjectService,
        @Inject(forwardRef(() => CollaborationService))
        private readonly collaborationService: CollaborationService,
        private readonly usersService: UsersService,
    ) { }

    // ─── createPlan ──────────────────────────────────────────────────────────────

    async createPlan(dto: CreatePlanDto, userId: string, brandId?: string): Promise<PlanDocument> {
        if (brandId) {
            await this.assertBrandOwnership(brandId, userId);
        }

        const startDate = new Date(dto.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + dto.durationWeeks * 7);

        const plan = new this.planModel({
            userId,
            brandId,
            name: dto.name,
            objective: dto.objective,
            startDate,
            endDate,
            durationWeeks: dto.durationWeeks,
            promotionIntensity: dto.promotionIntensity,
            postingFrequency: dto.postingFrequency ?? 3,
            platforms: dto.platforms ?? [],
            productIds: dto.productIds ?? [],
            contentMixPreference: dto.contentMixPreference ?? {
                educational: 25, promotional: 25, storytelling: 25, authority: 25,
            },
            status: PlanStatus.DRAFT,
            phases: [],
        });

        return plan.save();
    }

    // ─── findAll ─────────────────────────────────────────────────────────────────

    async findAll(userId: string, brandId?: string): Promise<PlanDocument[]> {
        const collabPlanIds = await this.collaborationService.getCollaboratorPlanIds(userId);
        
        const filter: Record<string, any> = {
            $or: [
                { userId },
                { _id: { $in: collabPlanIds } }
            ]
        };
        if (brandId) filter.brandId = brandId;
        
        return this.planModel.find(filter).sort({ createdAt: -1 }).exec();
    }

    // ─── findOne ─────────────────────────────────────────────────────────────────

    async findOne(planId: string, userId: string, skipCollaboratorCheck = false): Promise<PlanDocument> {
        let plan = await this.planModel.findOne({ _id: planId, userId }).exec();
        if (!plan && !skipCollaboratorCheck) {
            const isCollab = await this.collaborationService.assertAccess(planId, userId).catch(() => false);
            if (isCollab) {
                plan = await this.planModel.findOne({ _id: planId }).exec();
            }
        }
        if (!plan) throw new NotFoundException(`Plan ${planId} not found`);
        return plan;
    }

    async findMany(ids: string[]): Promise<PlanDocument[]> {
        return this.planModel.find({ _id: { $in: ids } }).populate('brandId', 'name').sort({ updatedAt: -1 }).exec();
    }

    async findOwnedPlanIds(userId: string): Promise<string[]> {
        const plans = await this.planModel.find({ userId }).select('_id').exec();
        return plans.map(p => p._id.toString());
    }

    // ─── updatePlan ──────────────────────────────────────────────────────────────

    async updatePlan(planId: string, dto: UpdatePlanDto, userId: string): Promise<PlanDocument> {
        const plan = await this.findOne(planId, userId);

        if (plan.status === PlanStatus.COMPLETED) {
            throw new BadRequestException('Cannot edit a completed plan');
        }

        const update: Partial<Plan> = { ...dto } as any;

        if (dto.startDate || dto.durationWeeks) {
            const start = dto.startDate ? new Date(dto.startDate) : plan.startDate;
            const weeks = dto.durationWeeks ?? plan.durationWeeks;
            const end = new Date(start);
            end.setDate(end.getDate() + weeks * 7);
            (update as any).endDate = end;
        }

        const updated = await this.planModel
            .findOneAndUpdate({ _id: planId }, { $set: update }, { new: true })
            .exec();

        // Log activity
        if (updated) {
            const changes = Object.keys(dto);
            for (const key of changes) {
                await this.collaborationService.logActivity(
                    planId,
                    userId,
                    'User', // Fallback, normally fetch from DB or JWT
                    'update',
                    key,
                    (plan as any)[key]?.toString(),
                    (updated as any)[key]?.toString()
                );
            }
        }

        return updated!;
    }

    // ─── deletePlan ──────────────────────────────────────────────────────────────

    async deletePlan(planId: string, userId: string): Promise<void> {
        const result = await this.planModel.deleteOne({ _id: planId, userId }).exec();
        if (result.deletedCount === 0) throw new NotFoundException(`Plan ${planId} not found`);
        await this.calendarModel.deleteMany({ planId }).exec();
    }

    // ─── generatePlanStructure ───────────────────────────────────────────────────

    async generatePlanStructure(planId: string, userId: string): Promise<PlanDocument> {
        const plan = await this.findOne(planId, userId);
        let brandContext: any = { name: 'General Brand', tone: 'Professional', contentPillars: ['Educational', 'Promotional'] };
        
        if (plan.brandId) {
            const brand = await this.assertBrandOwnership(plan.brandId, userId);
            brandContext = this.toBrandContext(brand);
        }

        const structure = await this.planGenerator.generate(plan, brandContext);

        // Build embedded phases + content blocks from AI output
        const newPhases = structure.phases.map((aiPhase) => ({
            name: aiPhase.name,
            weekNumber: aiPhase.weekNumber,
            description: aiPhase.description || null,
            contentBlocks: aiPhase.contentBlocks.map((aiBlock) => ({
                title: aiBlock.title,
                pillar: aiBlock.pillar,
                productId: aiBlock.productId || null,
                format: aiBlock.format,
                ctaType: aiBlock.ctaType,
                emotionalTrigger: aiBlock.emotionalTrigger || null,
                recommendedDayOffset: aiBlock.recommendedDayOffset,
                recommendedTime: aiBlock.recommendedTime || null,
                status: ContentBlockStatus.DRAFT,
            })),
        }));

        // Single atomic update — replaces all phases
        const updated = await this.planModel
            .findOneAndUpdate(
                { _id: planId, userId },
                { $set: { phases: newPhases, status: PlanStatus.DRAFT } },
                { new: true },
            )
            .exec();

        this.logger.log(`Generated ${newPhases.length} phases for plan ${planId}`);
        return updated!;
    }

    // ─── activatePlan ────────────────────────────────────────────────────────────

    async activatePlan(planId: string, userId: string): Promise<PlanDocument> {
        const plan = await this.findOne(planId, userId);

        if (plan.status === PlanStatus.ACTIVE) {
            throw new BadRequestException('Plan is already active');
        }
        if (!plan.phases?.length) {
            throw new BadRequestException('Generate the plan structure before activating');
        }

        return this.planModel
            .findOneAndUpdate({ _id: planId, userId }, { $set: { status: PlanStatus.ACTIVE } }, { new: true })
            .exec() as Promise<PlanDocument>;
    }

    // ─── convertPlanToCalendar ───────────────────────────────────────────────────

    async convertPlanToCalendar(planId: string, userId: string): Promise<CalendarEntryDocument[]> {
        const plan = await this.findOne(planId, userId);
        let rotation = { maxConsecutivePromoPosts: 2, minGapBetweenPromotions: 3 };

        if (plan.brandId) {
            const brand = await this.assertBrandOwnership(plan.brandId, userId);
            rotation = brand.smartRotation ?? rotation;
        }

        if (!plan.phases?.length) {
            throw new BadRequestException('Generate plan structure first');
        }
        if (plan.status !== PlanStatus.ACTIVE) {
            throw new BadRequestException('Activate the plan before converting to calendar');
        }

        // Remove previous calendar entries for this plan
        await this.calendarModel.deleteMany({ planId }).exec();

        const startDate = new Date(plan.startDate);

        // Gather all blocks ordered by week then day offset
        const sortedPhases = [...plan.phases].sort((a, b) => a.weekNumber - b.weekNumber);
        const orderedBlocks: Array<{ block: any; phase: any }> = [];

        for (const phase of sortedPhases) {
            const sortedBlocks = [...phase.contentBlocks].sort(
                (a, b) => a.recommendedDayOffset - b.recommendedDayOffset,
            );
            for (const block of sortedBlocks) {
                orderedBlocks.push({ block, phase });
            }
        }

        // Apply smart rotation and build calendar entries
        const entries: Partial<CalendarEntry>[] = [];
        let consecutivePromo = 0;
        let lastPromoDate: Date | null = null;

        for (const { block, phase } of orderedBlocks) {
            let scheduledDate = this.computeDate(startDate, phase.weekNumber, block.recommendedDayOffset);
            const isPromo = block.ctaType === CtaType.HARD;

            if (isPromo) {
                if (consecutivePromo >= rotation.maxConsecutivePromoPosts) {
                    this.logger.debug(`Skipping promo block "${block.title}" — consecutive limit reached`);
                    consecutivePromo = 0;
                    continue;
                }
                if (lastPromoDate) {
                    const gap = this.daysDiff(scheduledDate, lastPromoDate);
                    if (gap < rotation.minGapBetweenPromotions) {
                        scheduledDate = new Date(lastPromoDate);
                        scheduledDate.setDate(scheduledDate.getDate() + rotation.minGapBetweenPromotions);
                    }
                }
                consecutivePromo++;
                lastPromoDate = scheduledDate;
            } else {
                consecutivePromo = 0;
            }

            // One entry per platform
            for (const platform of plan.platforms) {
                entries.push({
                    planId,
                    contentBlockId: block._id.toString(),
                    brandId: plan.brandId,
                    userId,
                    scheduledDate,
                    scheduledTime: block.recommendedTime ?? '12:00',
                    platform,
                    status: CalendarEntryStatus.SCHEDULED,
                });
            }
        }

        const saved = await this.calendarModel.insertMany(entries);
        this.logger.log(`Created ${saved.length} calendar entries for plan ${planId}`);
        return saved as unknown as CalendarEntryDocument[];
    }

    // ─── regeneratePlan ──────────────────────────────────────────────────────────

    async regeneratePlan(planId: string, userId: string): Promise<PlanDocument> {
        const plan = await this.findOne(planId, userId);

        if (plan.status === PlanStatus.COMPLETED) {
            throw new BadRequestException('Cannot regenerate a completed plan');
        }

        // Reset to draft and clear calendar
        await this.planModel.findOneAndUpdate({ _id: planId }, { $set: { status: PlanStatus.DRAFT } }).exec();
        await this.calendarModel.deleteMany({ planId }).exec();

        return this.generatePlanStructure(planId, userId);
    }

    // ─── updateCampaignCopy ──────────────────────────────────────────────────

    async updateCampaignCopy(planId: string, dto: UpdateCampaignCopyDto, userId: string): Promise<PlanDocument> {
        const plan = await this.findOne(planId, userId);
        const update: any = {};
        if (dto.campaignSlogan !== undefined) update.campaignSlogan = dto.campaignSlogan;
        if (dto.launchHeadline !== undefined) update.launchHeadline = dto.launchHeadline;
        const updated = await this.planModel
            .findOneAndUpdate({ _id: planId, userId }, { $set: update }, { new: true })
            .exec();
        return updated!;
    }

    // ─── getPlanStats ─────────────────────────────────────────────────────────────

    async getPlanStats(planId: string, userId: string) {
        const plan = await this.findOne(planId, userId);
        const blocks = plan.phases.flatMap(p => p.contentBlocks);

        const byFormat: Record<string, number> = {};
        const byCta: Record<string, number> = {};
        const byPillar: Record<string, number> = {};

        for (const b of blocks) {
            byFormat[b.format] = (byFormat[b.format] || 0) + 1;
            byCta[b.ctaType] = (byCta[b.ctaType] || 0) + 1;
            byPillar[b.pillar] = (byPillar[b.pillar] || 0) + 1;
        }

        return {
            totalPosts: blocks.length,
            byFormat,
            byCta,
            byPillar,
            byPhase: plan.phases.map(p => ({
                weekNumber: p.weekNumber,
                name: p.name,
                count: p.contentBlocks.length,
            })),
        };
    }

    // ─── getCalendar ─────────────────────────────────────────────────────────────

    async getCalendar(planId: string, userId: string): Promise<CalendarEntryDocument[]> {
        await this.findOne(planId, userId); // ownership check
        return this.calendarModel
            .find({ planId })
            .sort({ scheduledDate: 1, scheduledTime: 1 })
            .exec();
    }

    // ─── Project DNA ────────────────────────────────────────────────────────────
    async updateProjectDNA(planId: string, userId: string, update: any) {
        // Ownership check is handled by findOne
        const plan = await this.findOne(planId, userId);
        
        // Deep merge or specific path updates
        const updated = await this.planModel.findOneAndUpdate(
            { _id: planId },
            { $set: { projectDNA: { ...plan.projectDNA, ...update } } },
            { new: true }
        ).exec();

        await this.collaborationService.logActivity(planId, userId, 'User', 'update', 'project_dna');
        
        return updated;
    }

    async getAIInsights(planId: string, userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.isPremium) {
            throw new ForbiddenException('Only upgraded Brand Owner accounts can view AI Insights / DNA.');
        }

        await this.findOne(planId, userId);
        
        const [readinessScore, weakPoints, suggestions] = await Promise.all([
            this.aiProjectService.calculateReadinessScore(planId),
            this.aiProjectService.detectWeakPoints(planId),
            this.aiProjectService.suggestCollaborators(planId)
        ]);

        // Update plan with new score/points
        await this.planModel.updateOne(
            { _id: planId },
            { 
                $set: { 
                    'projectDNA.performance.readinessScore': readinessScore,
                    'projectDNA.performance.weakPoints': weakPoints 
                } 
            }
        ).exec();

        return {
            readinessScore,
            weakPoints,
            suggestedCollaborators: suggestions
        };
    }

    // ─── Private helpers ─────────────────────────────────────────────────────────

    private async assertBrandOwnership(brandId: string, userId: string): Promise<BrandDocument> {
        const brand = await this.brandModel.findOne({ _id: brandId, userId }).exec();
        if (!brand) throw new ForbiddenException('Brand not found or you do not own it');
        return brand;
    }

    private toBrandContext(brand: BrandDocument): BrandContext {
        return {
            name: brand.name,
            tone: brand.tone,
            contentPillars: brand.contentPillars ?? [],
            mainGoal: brand.mainGoal,
            contentMix: brand.contentMix as any,
            smartRotation: brand.smartRotation as any,
            audience: brand.audience as any,
            platforms: brand.platforms,
        };
    }

    private computeDate(startDate: Date, weekNumber: number, dayOffset: number): Date {
        const d = new Date(startDate);
        d.setDate(d.getDate() + (weekNumber - 1) * 7 + dayOffset);
        return d;
    }

    private daysDiff(a: Date, b: Date): number {
        return Math.abs(Math.floor((a.getTime() - b.getTime()) / 86_400_000));
    }
}

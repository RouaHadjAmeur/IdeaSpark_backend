import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
    ContentBlock,
    ContentBlockDocument,
    ContentBlockStatus,
    ContentCtaType,
    ContentFormat,
    ContentPlatform,
    ContentType,
    STATUS_TRANSITIONS,
} from './schemas/content-block.schema';
import { CreateContentBlockDto } from './dto/create-content-block.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AttachPlanDto } from './dto/attach-plan.dto';
import { ScheduleDto } from './dto/schedule.dto';
import { ReplaceDto } from './dto/replace.dto';

@Injectable()
export class ContentBlocksService {
    private readonly logger = new Logger(ContentBlocksService.name);

    constructor(
        @InjectModel(ContentBlock.name)
        private readonly model: Model<ContentBlockDocument>,
    ) { }

    // ─── Create (Save as Idea) ────────────────────────────────────────────────

    async create(dto: CreateContentBlockDto, userId: string): Promise<ContentBlockDocument> {
        const status =
            dto.scheduledAt && dto.scheduledAt.trim()
                ? ContentBlockStatus.SCHEDULED
                : ContentBlockStatus.IDEA;

        const block = new this.model({
            userId,
            brandId: dto.brandId,
            projectId: dto.projectId ?? null,
            planId: dto.planId ?? null,
            planPhaseId: dto.planPhaseId ?? null,
            phaseLabel: dto.phaseLabel ?? null,
            title: dto.title,
            description: dto.description ?? null,
            contentType: dto.contentType,
            platform: dto.platform,
            format: dto.format ?? null,
            hooks: dto.hooks ?? [],
            scriptOutline: dto.scriptOutline ?? null,
            ctaType: dto.ctaType,
            productId: dto.productId ?? null,
            tags: dto.tags ?? [],
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
            status,
        });

        this.logger.log(`Creating ContentBlock "${dto.title}" for user ${userId} with status ${status}`);
        return block.save();
    }

    // ─── Find All (with optional filters) ────────────────────────────────────

    async findAll(
        userId: string,
        filters?: { brandId?: string; planId?: string; status?: ContentBlockStatus },
    ): Promise<ContentBlockDocument[]> {
        const query: Record<string, any> = { userId };
        if (filters?.brandId) query.brandId = filters.brandId;
        if (filters?.planId) query.planId = filters.planId;
        if (filters?.status) query.status = filters.status;
        return this.model.find(query).sort({ createdAt: -1 }).exec();
    }

    // ─── Find One ────────────────────────────────────────────────────────────

    async findOne(id: string, userId: string): Promise<ContentBlockDocument> {
        const block = await this.model.findOne({ _id: id, userId }).exec();
        if (!block) throw new NotFoundException(`ContentBlock ${id} not found`);
        return block;
    }

    // ─── Update Status (with transition guard) ────────────────────────────────

    async updateStatus(id: string, dto: UpdateStatusDto, userId: string): Promise<ContentBlockDocument> {
        const block = await this.findOne(id, userId);
        this.assertTransitionAllowed(block.status, dto.status);

        // Extra rule: if scheduledAt exists, status must be scheduled or in_process
        if (
            dto.status === ContentBlockStatus.IDEA &&
            block.scheduledAt
        ) {
            throw new BadRequestException(
                'Cannot revert to "idea" when scheduledAt is already set. Clear scheduledAt first.',
            );
        }

        block.status = dto.status;
        return block.save();
    }

    // ─── Attach to Plan ───────────────────────────────────────────────────────

    async attachPlan(id: string, dto: AttachPlanDto, userId: string): Promise<ContentBlockDocument> {
        const block = await this.findOne(id, userId);

        block.planId = dto.planId;
        block.planPhaseId = dto.planPhaseId ?? block.planPhaseId;
        block.phaseLabel = dto.phaseLabel ?? block.phaseLabel;

        // Auto-advance status from idea → approved when attached to a plan
        if (block.status === ContentBlockStatus.IDEA) {
            block.status = ContentBlockStatus.APPROVED;
        }

        this.logger.log(`ContentBlock ${id} attached to plan ${dto.planId}`);
        return block.save();
    }

    // ─── Schedule ─────────────────────────────────────────────────────────────

    async schedule(id: string, dto: ScheduleDto, userId: string): Promise<ContentBlockDocument> {
        const block = await this.findOne(id, userId);

        // Must be approved or already scheduled to move to scheduled
        if (
            block.status !== ContentBlockStatus.APPROVED &&
            block.status !== ContentBlockStatus.SCHEDULED
        ) {
            this.assertTransitionAllowed(block.status, ContentBlockStatus.SCHEDULED);
        }

        block.scheduledAt = new Date(dto.scheduledAt);
        block.status = ContentBlockStatus.SCHEDULED;

        this.logger.log(`ContentBlock ${id} scheduled for ${dto.scheduledAt}`);
        return block.save();
    }

    // ─── Replace ──────────────────────────────────────────────────────────────

    async replace(id: string, dto: ReplaceDto, userId: string): Promise<ContentBlockDocument> {
        const [source, target] = await Promise.all([
            this.findOne(id, userId),
            this.findOne(dto.targetId, userId),
        ]);

        // Copy content fields; preserve scheduledAt, status, planId, etc. of target
        target.title = source.title;
        target.hooks = source.hooks;
        target.scriptOutline = source.scriptOutline;
        target.description = source.description;
        target.contentType = source.contentType;
        target.ctaType = source.ctaType;
        target.format = source.format;

        // Ensure status stays scheduled if it was scheduled
        if (target.scheduledAt && target.status === ContentBlockStatus.IDEA) {
            target.status = ContentBlockStatus.SCHEDULED;
        }

        this.logger.log(`ContentBlock ${dto.targetId} replaced with content from ${id}`);
        return target.save();
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    async remove(id: string, userId: string): Promise<void> {
        const result = await this.model.deleteOne({ _id: id, userId }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`ContentBlock ${id} not found`);
        }
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private assertTransitionAllowed(
        current: ContentBlockStatus,
        next: ContentBlockStatus,
    ): void {
        const allowed = STATUS_TRANSITIONS[current] ?? [];
        if (!allowed.includes(next)) {
            throw new BadRequestException(
                `Invalid status transition: "${current}" → "${next}". ` +
                `Allowed transitions from "${current}": [${allowed.join(', ') || 'none'}].`,
            );
        }
    }
}

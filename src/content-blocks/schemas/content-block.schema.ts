import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ContentBlockStatus {
    IDEA = 'idea',
    APPROVED = 'approved',
    SCHEDULED = 'scheduled',
    IN_PROCESS = 'in_process',
    TERMINATED = 'terminated',
}

export enum ContentType {
    EDUCATIONAL = 'educational',
    PROMO = 'promo',
    TEASER = 'teaser',
    LAUNCH = 'launch',
    SOCIAL_PROOF = 'social_proof',
    OBJECTION = 'objection',
    BEHIND_SCENES = 'behind_scenes',
    AUTHORITY = 'authority',
}

export enum ContentPlatform {
    TIKTOK = 'tiktok',
    INSTAGRAM = 'instagram',
    YOUTUBE = 'youtube',
    FACEBOOK = 'facebook',
    LINKEDIN = 'linkedin',
}

export enum ContentFormat {
    REEL = 'reel',
    SHORT = 'short',
    POST = 'post',
    CAROUSEL = 'carousel',
    STORY = 'story',
    LIVE = 'live',
}

export enum ContentCtaType {
    SOFT = 'soft',
    HARD = 'hard',
    EDUCATIONAL = 'educational',
}

// ─── Allowed status transitions ───────────────────────────────────────────────

export const STATUS_TRANSITIONS: Record<ContentBlockStatus, ContentBlockStatus[]> = {
    [ContentBlockStatus.IDEA]: [ContentBlockStatus.APPROVED, ContentBlockStatus.TERMINATED],
    [ContentBlockStatus.APPROVED]: [ContentBlockStatus.SCHEDULED, ContentBlockStatus.TERMINATED],
    [ContentBlockStatus.SCHEDULED]: [ContentBlockStatus.IN_PROCESS, ContentBlockStatus.TERMINATED],
    [ContentBlockStatus.IN_PROCESS]: [ContentBlockStatus.TERMINATED],
    [ContentBlockStatus.TERMINATED]: [],
};

// ─── Schema ───────────────────────────────────────────────────────────────────

export type ContentBlockDocument = ContentBlock & Document;

@Schema({ timestamps: true, collection: 'contentblocks' })
export class ContentBlock {
    // ─ Ownership
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    brandId: string;

    // ─ Optional context
    @Prop({ type: String, default: null })
    projectId: string | null;

    @Prop({ type: String, default: null })
    planId: string | null;

    /** _id of the embedded Phase inside the Plan */
    @Prop({ type: String, default: null })
    planPhaseId: string | null;

    /** Human-readable label: e.g. "Week 1 — Tease" */
    @Prop({ type: String, default: null })
    phaseLabel: string | null;

    // ─ Content data
    @Prop({ required: true, maxlength: 300 })
    title: string;

    @Prop({ type: String, default: null })
    description: string | null;

    @Prop({ required: true, enum: Object.values(ContentType) })
    contentType: ContentType;

    @Prop({ required: true, enum: Object.values(ContentPlatform) })
    platform: ContentPlatform;

    @Prop({ type: String, enum: Object.values(ContentFormat), default: null })
    format: ContentFormat | null;

    @Prop({ type: [String], default: [] })
    hooks: string[];

    @Prop({ type: String, default: null })
    scriptOutline: string | null;

    @Prop({ required: true, enum: Object.values(ContentCtaType) })
    ctaType: ContentCtaType;

    @Prop({ type: String, default: null })
    productId: string | null;

    @Prop({ type: [String], default: [] })
    tags: string[];

    // ─ Scheduling
    @Prop({ type: Date, default: null })
    scheduledAt: Date | null;

    // ─ Status
    @Prop({
        required: true,
        enum: Object.values(ContentBlockStatus),
        default: ContentBlockStatus.IDEA,
    })
    status: ContentBlockStatus;

    // ─ Timestamps (mongoose auto)
    createdAt: Date;
    updatedAt: Date;
}

export const ContentBlockSchema = SchemaFactory.createForClass(ContentBlock);

// ─── Indexes ──────────────────────────────────────────────────────────────────

ContentBlockSchema.index({ userId: 1, status: 1 });
ContentBlockSchema.index({ brandId: 1 });
ContentBlockSchema.index({ planId: 1 });
ContentBlockSchema.index({ scheduledAt: 1 });

// ─── toJSON transform ─────────────────────────────────────────────────────────

ContentBlockSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

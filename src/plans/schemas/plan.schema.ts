import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ─── Enums ─────────────────────────────────────────────────────────────────────

export enum PlanObjective {
    BRAND_AWARENESS = 'brand_awareness',
    LEAD_GENERATION = 'lead_generation',
    SALES_CONVERSION = 'sales_conversion',
    AUDIENCE_GROWTH = 'audience_growth',
    PRODUCT_LAUNCH = 'product_launch',
    SEASONAL_CAMPAIGN = 'seasonal_campaign',
}

export enum PlanStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    COMPLETED = 'completed',
}

export enum PlanPromotionIntensity {
    LOW = 'low',
    BALANCED = 'balanced',
    AGGRESSIVE = 'aggressive',
}

export enum ContentFormat {
    REEL = 'reel',
    CAROUSEL = 'carousel',
    STORY = 'story',
    POST = 'post',
}

export enum CtaType {
    SOFT = 'soft',
    HARD = 'hard',
    EDUCATIONAL = 'educational',
}

export enum ContentBlockStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    EDITED = 'edited',
}

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface ContentMixPreference {
    educational: number;
    promotional: number;
    storytelling: number;
    authority: number;
}

// ─── ContentBlock subdocument ──────────────────────────────────────────────────

@Schema({ _id: true, timestamps: true })
export class ContentBlock {
    _id: Types.ObjectId;

    @Prop({ required: true, maxlength: 300 })
    title: string;

    @Prop({ required: true, maxlength: 100 })
    pillar: string;

    @Prop({ type: String, default: null })
    productId: string | null;

    @Prop({ required: true, enum: Object.values(ContentFormat) })
    format: ContentFormat;

    @Prop({ required: true, enum: Object.values(CtaType) })
    ctaType: CtaType;

    @Prop({ type: String, default: null })
    emotionalTrigger: string | null;

    @Prop({ default: 0 })
    recommendedDayOffset: number;

    @Prop({ type: String, default: null })
    recommendedTime: string | null;

    @Prop({ enum: Object.values(ContentBlockStatus), default: ContentBlockStatus.DRAFT })
    status: ContentBlockStatus;
}

const ContentBlockSchema = SchemaFactory.createForClass(ContentBlock);

// ─── Phase subdocument ─────────────────────────────────────────────────────────

@Schema({ _id: true })
export class Phase {
    _id: Types.ObjectId;

    @Prop({ required: true, maxlength: 100 })
    name: string;

    @Prop({ required: true })
    weekNumber: number;

    @Prop({ type: String, default: null })
    description: string | null;

    @Prop({ type: [ContentBlockSchema], default: [] })
    contentBlocks: ContentBlock[];
}

const PhaseSchema = SchemaFactory.createForClass(Phase);

// ─── Plan document ─────────────────────────────────────────────────────────────

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    brandId: string;

    @Prop({ required: true, maxlength: 200 })
    name: string;

    @Prop({ required: true, enum: Object.values(PlanObjective) })
    objective: PlanObjective;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({ required: true })
    durationWeeks: number;

    @Prop({ enum: Object.values(PlanPromotionIntensity), default: PlanPromotionIntensity.BALANCED })
    promotionIntensity: PlanPromotionIntensity;

    @Prop({ default: 3 })
    postingFrequency: number;

    @Prop({ type: [String], default: [] })
    platforms: string[];

    @Prop({ type: [String], default: [] })
    productIds: string[];

    @Prop({
        type: { educational: Number, promotional: Number, storytelling: Number, authority: Number },
        default: { educational: 25, promotional: 25, storytelling: 25, authority: 25 },
    })
    contentMixPreference: ContentMixPreference;

    @Prop({ enum: Object.values(PlanStatus), default: PlanStatus.DRAFT })
    status: PlanStatus;

    @Prop({ type: [PhaseSchema], default: [] })
    phases: Phase[];

    // ─ Campaign copy (set via PATCH /plans/:id/campaign-copy) ─────────────────
    @Prop({ type: String, default: null })
    campaignSlogan: string | null;

    @Prop({ type: String, default: null })
    launchHeadline: string | null;

    createdAt: Date;
    updatedAt: Date;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);

PlanSchema.index({ userId: 1 });
PlanSchema.index({ brandId: 1 });

PlanSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

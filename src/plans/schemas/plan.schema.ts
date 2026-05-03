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

export enum PhaseStatus {
    TERMINATED = 'terminated',
    IN_PROGRESS = 'in_progress',
    UPCOMING = 'upcoming',
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

    @Prop({ type: String, default: '' })
    hook: string;

    @Prop({ type: String, default: '' })
    caption: string;

    @Prop({ type: Boolean, default: false })
    hookGenerated: boolean;

    @Prop({ type: Boolean, default: false })
    captionGenerated: boolean;
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

    @Prop({ enum: Object.values(PhaseStatus), default: PhaseStatus.UPCOMING })
    status: PhaseStatus;

    @Prop({ type: [String], default: [] })
    productIds: string[];
}

const PhaseSchema = SchemaFactory.createForClass(Phase);

// ─── Project DNA subdocuments ──────────────────────────────────────────────────

@Schema({ _id: false })
export class StrategicDNA {
    @Prop({ default: '' })
    vision: string;

    @Prop({ type: [String], default: [] })
    targetAudience: string[];

    @Prop({ default: '' })
    offer: string;

    @Prop({ default: '' })
    positioning: string;

    @Prop({ default: '' })
    campaignAngle: string;

    @Prop({ type: [String], default: [] })
    kpis: string[];
}

@Schema({ _id: false })
export class ExecutionDNA {
    @Prop({ default: 0 })
    progressPercentage: number;

    @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
    taskIds: Types.ObjectId[];

    @Prop()
    overallDeadline?: Date;
}

@Schema({ _id: false })
export class ResourceDNA {
    @Prop({ type: [Object], default: [] })
    assets: Array<{ type: string; url: string; label: string }>;

    @Prop({ type: [String], default: [] })
    landingPages: string[];

    @Prop({ type: [String], default: [] })
    references: string[];
}

@Schema({ _id: false })
export class SkillDNA {
    @Prop({ type: [String], default: [] })
    requiredRoles: string[];

    @Prop({ type: [String], default: [] })
    missingRoles: string[];
}

@Schema({ _id: false })
export class BudgetDNA {
    @Prop({ default: 0 })
    totalBudget: number;

    @Prop({ default: 0 })
    spentBudget: number;

    @Prop({ type: [Object], default: [] })
    platformROAS: Array<{ platform: string; roas: number; percentage: number }>;
}

@Schema({ _id: false })
export class PerformanceDNA {
    @Prop({ default: 0 })
    readinessScore: number;

    @Prop({ type: [String], default: [] })
    weakPoints: string[];

    @Prop({ type: [String], default: [] })
    blockers: string[];

    @Prop({ default: 0 })
    consistencyScore: number;

    @Prop({ default: 0 })
    engagementScore: number;

    @Prop({ default: 0 })
    budgetScore: number;

    @Prop({ default: 0 })
    timingScore: number;
}

@Schema({ _id: false })
export class ProjectDNA {
    @Prop({ type: StrategicDNA, default: () => ({}) })
    strategic: StrategicDNA;

    @Prop({ type: ExecutionDNA, default: () => ({}) })
    execution: ExecutionDNA;

    @Prop({ type: ResourceDNA, default: () => ({}) })
    resource: ResourceDNA;

    @Prop({ type: SkillDNA, default: () => ({}) })
    skill: SkillDNA;

    @Prop({ type: PerformanceDNA, default: () => ({}) })
    performance: PerformanceDNA;

    @Prop({ type: BudgetDNA, default: () => ({}) })
    budget: BudgetDNA;
}

const ProjectDNASchema = SchemaFactory.createForClass(ProjectDNA);

// ─── Plan document ─────────────────────────────────────────────────────────────

export type PlanDocument = Plan & Document;

@Schema({ timestamps: true })
export class Plan {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: false })
    brandId?: string;

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

    @Prop({ type: ProjectDNASchema, default: () => ({}) })
    projectDNA: ProjectDNA;

    @Prop({ type: String, default: null })
    campaignSlogan: string | null;

    @Prop({ type: String, default: null })
    launchHeadline: string | null;

    @Prop({ type: String, default: '' })
    notes: string;

    @Prop({ type: Boolean, default: true })
    notesSeen: boolean;

    @Prop({ type: String, default: null })
    lastNoteAuthorId: string | null;

    @Prop({ type: [String], default: [] })
    collaboratorIds: string[];

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

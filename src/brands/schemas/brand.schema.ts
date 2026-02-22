import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum BrandTone {
    PROFESSIONAL = 'professional',
    FRIENDLY = 'friendly',
    BOLD = 'bold',
    EDUCATIONAL = 'educational',
    LUXURY = 'luxury',
    PLAYFUL = 'playful',
}

export enum BrandPlatform {
    TIKTOK = 'tiktok',
    INSTAGRAM = 'instagram',
    YOUTUBE = 'youtube',
    FACEBOOK = 'facebook',
}

export enum BrandGoal {
    GROW_AUDIENCE = 'growAudience',
    INCREASE_SALES = 'increaseSales',
    BUILD_AUTHORITY = 'buildAuthority',
    PROMOTE_PRODUCTS = 'promoteProducts',
    AFFILIATE_MARKETING = 'affiliateMarketing',
    PERSONAL_BRAND = 'personalBrand',
}

export enum PostingFrequency {
    THREE_PER_WEEK = 'threePerWeek',
    FIVE_PER_WEEK = 'fivePerWeek',
    DAILY = 'daily',
    CUSTOM = 'custom',
}

export enum RevenueType {
    PHYSICAL_PRODUCTS = 'physicalProducts',
    DIGITAL_PRODUCTS = 'digitalProducts',
    SERVICES = 'services',
    AFFILIATE = 'affiliate',
    SPONSORSHIPS = 'sponsorships',
    MIXED = 'mixed',
}

export enum PromotionIntensity {
    LOW = 'low',
    BALANCED = 'balanced',
    AGGRESSIVE = 'aggressive',
}

export enum BrandSeasonality {
    SEASONAL = 'seasonal',
    ALWAYS_ACTIVE = 'alwaysActive',
    CAMPAIGN_BASED = 'campaignBased',
}

// ─── Nested subdocuments ───

@Schema({ _id: false })
class Audience {
    @Prop({ default: '' })
    ageRange: string;

    @Prop({ default: '' })
    gender: string;

    @Prop({ type: [String], default: [] })
    interests: string[];
}

const AudienceSchema = SchemaFactory.createForClass(Audience);

@Schema({ _id: false })
class ContentMix {
    @Prop({ default: 25 })
    educational: number;

    @Prop({ default: 25 })
    promotional: number;

    @Prop({ default: 25 })
    storytelling: number;

    @Prop({ default: 25 })
    authority: number;
}

const ContentMixSchema = SchemaFactory.createForClass(ContentMix);

@Schema({ _id: false })
class BrandKPIs {
    @Prop()
    monthlyRevenueTarget?: number;

    @Prop()
    monthlyFollowerGrowthTarget?: number;

    @Prop()
    campaignConversionGoal?: number;
}

const BrandKPIsSchema = SchemaFactory.createForClass(BrandKPIs);

@Schema({ _id: false })
class SmartRotation {
    @Prop({ default: 2 })
    maxConsecutivePromoPosts: number;

    @Prop({ default: 3 })
    minGapBetweenPromotions: number;
}

const SmartRotationSchema = SchemaFactory.createForClass(SmartRotation);

// ─── Main Brand document ───

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {
    // Identity
    @ApiProperty({ example: 'My Brand' })
    @Prop({ required: true })
    name: string;

    @ApiProperty({ required: false })
    @Prop()
    description?: string;

    @ApiProperty({ enum: BrandTone, example: BrandTone.PROFESSIONAL })
    @Prop({ required: true, enum: Object.values(BrandTone) })
    tone: BrandTone;

    @Prop({ type: AudienceSchema })
    audience?: Audience;

    @Prop({ type: [String], enum: Object.values(BrandPlatform), default: [] })
    platforms: BrandPlatform[];

    @Prop({
        type: [String],
        default: [],
        validate: {
            validator: (val: string[]) => val.length <= 5,
            message: 'contentPillars cannot exceed 5 items',
        },
    })
    contentPillars: string[];

    // Strategic objective
    @Prop({ enum: Object.values(BrandGoal) })
    mainGoal?: BrandGoal;

    @Prop({ type: BrandKPIsSchema })
    kpis?: BrandKPIs;

    // Content strategy
    @Prop({ enum: Object.values(PostingFrequency) })
    postingFrequency?: PostingFrequency;

    @Prop()
    customPostingFrequency?: string;

    @Prop({ type: ContentMixSchema })
    contentMix?: ContentMix;

    // Monetization
    @Prop({ type: [String], enum: Object.values(RevenueType), default: [] })
    revenueTypes: RevenueType[];

    @Prop({ enum: Object.values(PromotionIntensity) })
    promotionIntensity?: PromotionIntensity;

    // Positioning
    @Prop()
    uniqueAngle?: string;

    @Prop()
    mainPainPointSolved?: string;

    // Competition & calendar
    @Prop({ type: [String], default: [] })
    competitors: string[];

    @Prop({ enum: Object.values(BrandSeasonality) })
    seasonality?: BrandSeasonality;

    // Smart rotation
    @Prop({ type: SmartRotationSchema })
    smartRotation?: SmartRotation;

    // Auth
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: string;

    createdAt: Date;
    updatedAt: Date;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

// Composite unique index: one brand name per user
BrandSchema.index({ name: 1, userId: 1 }, { unique: true });

BrandSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsArray,
    IsNumber,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentPlatform } from '../../content-blocks/schemas/content-block.schema';

export class GenerateVideoIdeaDto {
    // ─── Product / Brief ─────────────────────────────────────────────────────

    @ApiProperty({ example: 'Smart Water Bottle' })
    @IsNotEmpty()
    @IsString()
    productName: string;

    @ApiPropertyOptional({ example: 'Health & Fitness' })
    @IsOptional()
    @IsString()
    productCategory?: string;

    @ApiPropertyOptional({ type: [String], example: ['Tracks hydration', 'LED reminders'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keyBenefits?: string[];

    @ApiPropertyOptional({ example: 'forgetting to drink water' })
    @IsOptional()
    @IsString()
    painPoint?: string;

    // ─── Brand context ────────────────────────────────────────────────────────

    @ApiPropertyOptional({ description: 'Brand ID — used to enrich context' })
    @IsOptional()
    @IsString()
    brandId?: string;

    @ApiPropertyOptional({ example: 'professional' })
    @IsOptional()
    @IsString()
    brandTone?: string;

    @ApiPropertyOptional({
        description: 'Brand target audience',
        example: { ageRange: '18-35', gender: 'all', interests: ['fitness', 'wellness'] },
    })
    @IsOptional()
    brandAudience?: { ageRange?: string; gender?: string; interests?: string[] };

    @ApiPropertyOptional({ type: [String], example: ['Education', 'Inspiration', 'Authority'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    contentPillars?: string[];

    // ─── Plan context ─────────────────────────────────────────────────────────

    @ApiPropertyOptional({ example: 'launch', enum: ['tease', 'launch', 'retarget'] })
    @IsOptional()
    @IsString()
    activePlanPhase?: string;

    @ApiPropertyOptional({ example: 2, description: 'Current week number of the plan' })
    @IsOptional()
    @IsInt()
    @Min(1)
    currentWeek?: number;

    @ApiPropertyOptional({ example: 0.35, description: 'Promo ratio from BI (0.0–1.0). Null if not available.' })
    @IsOptional()
    @IsNumber()
    promoRatio?: number;

    @ApiPropertyOptional({ description: 'Short summary of product exposure in recent posts (or null).' })
    @IsOptional()
    @IsString()
    productExposureSummary?: string;

    @ApiPropertyOptional({ description: 'Summary of upcoming calendar posts to avoid content repetition.' })
    @IsOptional()
    @IsString()
    calendarContext?: string;

    // ─── Output preferences ───────────────────────────────────────────────────

    @ApiPropertyOptional({ enum: ContentPlatform, example: ContentPlatform.INSTAGRAM })
    @IsOptional()
    @IsEnum(ContentPlatform)
    platform?: ContentPlatform;

    @ApiPropertyOptional({ example: 'English', enum: ['English', 'French', 'Arabic'] })
    @IsOptional()
    @IsString()
    language?: string;

    // ─── Direct plan attachment ────────────────────────────────────────────────

    @ApiPropertyOptional({ description: 'Plan ID to pre-set on the generated ContentBlock' })
    @IsOptional()
    @IsString()
    planId?: string;

    @ApiPropertyOptional({ description: 'Phase ID to pre-set on the generated ContentBlock' })
    @IsOptional()
    @IsString()
    planPhaseId?: string;
}

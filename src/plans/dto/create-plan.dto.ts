import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsDateString,
    IsInt,
    IsOptional,
    IsArray,
    IsObject,
    Min,
    Max,
    MaxLength,
    ValidateNested,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanObjective, PlanPromotionIntensity } from '../schemas/plan.schema';
import { Allow } from 'class-validator';

class ContentMixDto {
    @ApiPropertyOptional({ example: 30 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    educational?: number;

    @ApiPropertyOptional({ example: 25 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    promotional?: number;

    @ApiPropertyOptional({ example: 25 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    storytelling?: number;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    authority?: number;
}

export class CreatePlanDto {
    @ApiProperty({ example: 'Spring Launch Campaign' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @ApiProperty({ enum: PlanObjective, example: PlanObjective.PRODUCT_LAUNCH })
    @IsEnum(PlanObjective, { message: `objective must be one of: ${Object.values(PlanObjective).join(', ')}` })
    objective: PlanObjective;

    @ApiProperty({ example: '2026-03-01' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: 4, minimum: 1, maximum: 52 })
    @IsInt()
    @Min(1)
    @Max(52)
    durationWeeks: number;

    @ApiPropertyOptional({ enum: PlanPromotionIntensity, default: PlanPromotionIntensity.BALANCED })
    @IsEnum(PlanPromotionIntensity)
    @IsOptional()
    promotionIntensity?: PlanPromotionIntensity;

    @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 14 })
    @IsInt()
    @Min(1)
    @Max(14)
    @IsOptional()
    postingFrequency?: number;

    @ApiPropertyOptional({ example: ['instagram', 'tiktok'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    platforms?: string[];

    @ApiPropertyOptional({ example: ['prod_abc123'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    productIds?: string[];

    @ApiPropertyOptional({ type: ContentMixDto })
    @IsObject()
    @ValidateNested()
    @Type(() => ContentMixDto)
    @IsOptional()
    contentMixPreference?: ContentMixDto;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    notesSeen?: boolean;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    lastNoteAuthorId?: string;

    // ─── Extra optional fields (sent by mobile client) ───────────────────────

    @ApiPropertyOptional({ description: 'Brand ID (also accepted as query param)' })
    @IsOptional()
    @IsString()
    brandId?: string;

    @ApiPropertyOptional({ description: 'End date of the campaign (ISO string)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Project DNA object (budget, strategic, etc.)' })
    @IsOptional()
    @IsObject()
    projectDNA?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Initial phases (optional, AI will generate later)' })
    @IsOptional()
    @IsArray()
    phases?: any[];
}

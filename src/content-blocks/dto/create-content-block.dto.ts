import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsArray,
    IsDateString,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ContentBlockStatus,
    ContentCtaType,
    ContentFormat,
    ContentPlatform,
    ContentType,
} from '../schemas/content-block.schema';

export class CreateContentBlockDto {
    // ─ Required context
    @ApiProperty({ description: 'Brand ID (required)' })
    @IsNotEmpty()
    @IsString()
    brandId: string;

    @ApiPropertyOptional({ description: 'Project ID (optional)' })
    @IsOptional()
    @IsString()
    projectId?: string;

    @ApiPropertyOptional({ description: 'Plan ID (optional)' })
    @IsOptional()
    @IsString()
    planId?: string;

    @ApiPropertyOptional({ description: 'Phase ID inside the plan (optional)' })
    @IsOptional()
    @IsString()
    planPhaseId?: string;

    @ApiPropertyOptional({ description: 'Human-readable phase label, e.g. "Week 1 — Tease"' })
    @IsOptional()
    @IsString()
    phaseLabel?: string;

    // ─ Content
    @ApiProperty({ description: 'Content block title', maxLength: 300 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(300)
    title: string;

    @ApiPropertyOptional({ description: 'Long description or brief' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: ContentType, description: 'Content type / pillar' })
    @IsEnum(ContentType)
    contentType: ContentType;

    @ApiProperty({ enum: ContentPlatform, description: 'Target platform' })
    @IsEnum(ContentPlatform)
    platform: ContentPlatform;

    @ApiPropertyOptional({ enum: ContentFormat, description: 'Content format' })
    @IsOptional()
    @IsEnum(ContentFormat)
    format?: ContentFormat;

    @ApiPropertyOptional({ type: [String], description: 'Hook options (attention-grabbing openers)' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hooks?: string[];

    @ApiPropertyOptional({ description: 'Script outline or full script' })
    @IsOptional()
    @IsString()
    scriptOutline?: string;

    @ApiProperty({ enum: ContentCtaType, description: 'Call-to-action type' })
    @IsEnum(ContentCtaType)
    ctaType: ContentCtaType;

    @ApiPropertyOptional({ description: 'Featured product ID (optional)' })
    @IsOptional()
    @IsString()
    productId?: string;

    @ApiPropertyOptional({ type: [String], description: 'Freeform tags' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({ description: 'Schedule date/time (ISO 8601). If set, status becomes scheduled.' })
    @IsOptional()
    @IsDateString()
    scheduledAt?: string;

    // status is always set to IDEA on creation — not accepted from client
}

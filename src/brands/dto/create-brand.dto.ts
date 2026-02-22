import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEnum,
    IsArray,
    ArrayMaxSize,
    ArrayMinSize,
    ValidateNested,
    IsObject,
    MaxLength,
    IsNumber,
    Min,
    Max,
    IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    BrandTone,
    BrandPlatform,
    BrandGoal,
    PostingFrequency,
    RevenueType,
    PromotionIntensity,
    BrandSeasonality,
} from '../schemas/brand.schema';

// ─── Nested DTOs ───

class AudienceDto {
    @ApiPropertyOptional({ example: '18-35' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    ageRange?: string;

    @ApiPropertyOptional({ example: 'All' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    gender?: string;

    @ApiPropertyOptional({ example: ['fashion', 'music', 'tech'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    interests?: string[];
}

class ContentMixDto {
    @ApiPropertyOptional({ example: 25 })
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

    @ApiPropertyOptional({ example: 25 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(100)
    authority?: number;
}

class BrandKPIsDto {
    @ApiPropertyOptional({ example: 5000 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    monthlyRevenueTarget?: number;

    @ApiPropertyOptional({ example: 1000 })
    @IsOptional()
    @IsInt()
    @Min(0)
    monthlyFollowerGrowthTarget?: number;

    @ApiPropertyOptional({ example: 3.5 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    campaignConversionGoal?: number;
}

class SmartRotationDto {
    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    maxConsecutivePromoPosts?: number;

    @ApiPropertyOptional({ example: 3 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(30)
    minGapBetweenPromotions?: number;
}

// ─── Main DTO ───

export class CreateBrandDto {
    @ApiProperty({ example: 'Nike Tunisia' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiPropertyOptional({ example: 'A premium streetwear brand targeting young adults.' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiProperty({ enum: BrandTone, example: BrandTone.BOLD })
    @IsEnum(BrandTone, { message: `tone must be one of: ${Object.values(BrandTone).join(', ')}` })
    tone: BrandTone;

    @ApiPropertyOptional({ type: AudienceDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => AudienceDto)
    audience?: AudienceDto;

    @ApiProperty({ enum: BrandPlatform, isArray: true, example: [BrandPlatform.INSTAGRAM] })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one platform is required' })
    @IsEnum(BrandPlatform, { each: true, message: `Each platform must be one of: ${Object.values(BrandPlatform).join(', ')}` })
    platforms: BrandPlatform[];

    @ApiPropertyOptional({ example: ['Quality', 'Innovation'], maxItems: 5 })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5, { message: 'contentPillars cannot exceed 5 items' })
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    contentPillars?: string[];

    // Strategic objective
    @ApiPropertyOptional({ enum: BrandGoal })
    @IsOptional()
    @IsEnum(BrandGoal)
    mainGoal?: BrandGoal;

    @ApiPropertyOptional({ type: BrandKPIsDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => BrandKPIsDto)
    kpis?: BrandKPIsDto;

    // Content strategy
    @ApiPropertyOptional({ enum: PostingFrequency })
    @IsOptional()
    @IsEnum(PostingFrequency)
    postingFrequency?: PostingFrequency;

    @ApiPropertyOptional({ example: '2x per week' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    customPostingFrequency?: string;

    @ApiPropertyOptional({ type: ContentMixDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => ContentMixDto)
    contentMix?: ContentMixDto;

    // Monetization
    @ApiPropertyOptional({ enum: RevenueType, isArray: true })
    @IsOptional()
    @IsArray()
    @IsEnum(RevenueType, { each: true })
    revenueTypes?: RevenueType[];

    @ApiPropertyOptional({ enum: PromotionIntensity })
    @IsOptional()
    @IsEnum(PromotionIntensity)
    promotionIntensity?: PromotionIntensity;

    // Positioning
    @ApiPropertyOptional({ example: 'First brand in Tunisia to combine X and Y.' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    uniqueAngle?: string;

    @ApiPropertyOptional({ example: 'Parents struggle to find educational toys.' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    mainPainPointSolved?: string;

    // Competition & calendar
    @ApiPropertyOptional({ example: ['Nike', 'Adidas'] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(3)
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    competitors?: string[];

    @ApiPropertyOptional({ enum: BrandSeasonality })
    @IsOptional()
    @IsEnum(BrandSeasonality)
    seasonality?: BrandSeasonality;

    // Smart rotation
    @ApiPropertyOptional({ type: SmartRotationDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => SmartRotationDto)
    smartRotation?: SmartRotationDto;
}

import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Platform {
    TikTok = 'TikTok',
    InstagramReels = 'InstagramReels',
    YouTubeShorts = 'YouTubeShorts',
    YouTubeLong = 'YouTubeLong',
}

export enum DurationOption {
    S15 = '15s',
    S30 = '30s',
    S60 = '60s',
    S90 = '90s',
}

export enum Goal {
    SellProduct = 'SellProduct',
    BrandAwareness = 'BrandAwareness',
    UGCReview = 'UGCReview',
    OfferPromo = 'OfferPromo',
    Education = 'Education',
    ViralEngagement = 'ViralEngagement',
}

export enum CreatorType {
    EcommerceBrand = 'EcommerceBrand',
    Influencer = 'Influencer',
}

export enum VideoTone {
    Trendy = 'Trendy',
    Professional = 'Professional',
    Emotional = 'Emotional',
    Funny = 'Funny',
    Luxury = 'Luxury',
    DirectResponse = 'DirectResponse',
}

export enum VideoLanguage {
    French = 'French',
    English = 'English',
    Arabic = 'Arabic',
}

export class CreateVideoRequestDto {
    @ApiProperty({
        description: 'Target platform for the video',
        enum: Platform,
        example: 'TikTok',
    })
    @IsEnum(Platform)
    platform: Platform;

    @ApiProperty({
        description: 'Video duration',
        enum: DurationOption,
        example: '30s',
    })
    @IsEnum(DurationOption)
    duration: DurationOption;

    @ApiProperty({
        description: 'Video marketing goal',
        enum: Goal,
        example: 'SellProduct',
    })
    @IsEnum(Goal)
    goal: Goal;

    @ApiProperty({
        description: 'Type of content creator',
        enum: CreatorType,
        example: 'EcommerceBrand',
    })
    @IsEnum(CreatorType)
    creatorType: CreatorType;

    @ApiProperty({
        description: 'Video tone and style',
        enum: VideoTone,
        example: 'Trendy',
    })
    @IsEnum(VideoTone)
    tone: VideoTone;

    @ApiProperty({
        description: 'Video language',
        enum: VideoLanguage,
        example: 'English',
    })
    @IsEnum(VideoLanguage)
    language: VideoLanguage;

    @ApiProperty({
        description: 'Name of the product or service',
        example: 'Smart Water Bottle',
    })
    @IsNotEmpty()
    @IsString()
    productName: string;

    @ApiProperty({
        description: 'Product category',
        example: 'Health & Fitness',
    })
    @IsNotEmpty()
    @IsString()
    productCategory: string;

    @ApiProperty({
        description: 'Key benefits of the product',
        type: [String],
        example: ['Tracks hydration', 'LED reminders', 'Keeps drinks cold for 24h'],
    })
    @IsArray()
    @IsString({ each: true })
    keyBenefits: string[];

    @ApiProperty({
        description: 'Target audience description',
        example: 'fitness enthusiasts',
    })
    @IsNotEmpty()
    @IsString()
    targetAudience: string;

    @ApiPropertyOptional({
        description: 'Product price',
        example: '$49.99',
    })
    @IsOptional()
    @IsString()
    price?: string;

    @ApiPropertyOptional({
        description: 'Special offer or discount',
        example: '20% off with code HYDRATE20',
    })
    @IsOptional()
    @IsString()
    offer?: string;

    @ApiPropertyOptional({
        description: 'Pain point that the product solves',
        example: 'forgetting to drink water',
    })
    @IsOptional()
    @IsString()
    painPoint?: string;

    @ApiPropertyOptional({
        description: 'Short product description',
        example: 'A smart water bottle that tracks your daily hydration and reminds you to drink.',
    })
    @IsOptional()
    @IsString()
    productDescription?: string;

    @ApiPropertyOptional({
        description: 'Detailed product specifications or features',
        example: '500ml capacity, BPA-free, LED display, 24h battery life',
    })
    @IsOptional()
    @IsString()
    productDetails?: string;

    @ApiPropertyOptional({
        description: 'Social proof (reviews, ratings, testimonials, number of users)',
        example: '4.8/5 stars, 10,000+ happy customers',
    })
    @IsOptional()
    @IsString()
    socialProof?: string;

    @ApiPropertyOptional({
        description: 'Number of video ideas to generate',
        minimum: 1,
        maximum: 10,
        default: 3,
        example: 3,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    batchSize: number = 3;
}

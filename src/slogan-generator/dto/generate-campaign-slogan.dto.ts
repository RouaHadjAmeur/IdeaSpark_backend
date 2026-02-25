import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateCampaignSloganDto {
    @ApiProperty({ example: 'professional', description: 'Brand tone (e.g. professional, bold, playful)' })
    @IsNotEmpty()
    @IsString()
    brandTone: string;

    @ApiPropertyOptional({ example: 'The smart hydration brand for serious athletes', description: 'Brand positioning statement' })
    @IsOptional()
    @IsString()
    brandPositioning?: string;

    @ApiProperty({ example: 'product_launch', description: 'Campaign objective', enum: ['product_launch', 'brand_awareness', 'seasonal_promo', 'retargeting', 'lead_generation'] })
    @IsNotEmpty()
    @IsString()
    campaignObjective: string;

    @ApiPropertyOptional({ example: 'Smart Water Bottle Pro', description: 'Product name (optional)' })
    @IsOptional()
    @IsString()
    productName?: string;

    @ApiProperty({ type: [String], example: ['24h hydration tracking', 'LED reminders', 'BPA-free'] })
    @IsArray()
    @IsString({ each: true })
    keyBenefits: string[];

    @ApiPropertyOptional({ example: 'instagram', description: 'Target platform (optional, influences tone)' })
    @IsOptional()
    @IsString()
    platform?: string;

    @ApiProperty({ example: 'en', enum: ['en', 'fr', 'ar', 'es', 'de'] })
    @IsNotEmpty()
    @IsString()
    language: string;
}

export class CampaignCopyResultDto {
    slogans: string[];
    taglines: string[];
    headlines: string[];
    brandName?: string;
    generatedAt: Date;
}

import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateCaptionDto {
  @ApiProperty() @IsString() @IsNotEmpty() postTitle: string;
  @ApiProperty({ enum: ['Instagram', 'TikTok', 'Facebook', 'LinkedIn'] })
  @IsEnum(['Instagram', 'TikTok', 'Facebook', 'LinkedIn']) platform: string;
  @ApiProperty({ enum: ['reel', 'carousel', 'story', 'post'] })
  @IsEnum(['reel', 'carousel', 'story', 'post']) format: string;
  @ApiProperty() @IsString() @IsNotEmpty() pillar: string;
  @ApiProperty({ enum: ['hard', 'soft', 'educational'] })
  @IsEnum(['hard', 'soft', 'educational']) ctaType: string;
  @ApiProperty() @IsString() @IsNotEmpty() brandName: string;
  @ApiProperty({ enum: ['fr', 'en', 'ar'], default: 'fr' })
  @IsEnum(['fr', 'en', 'ar']) @IsOptional() language: string = 'fr';
}

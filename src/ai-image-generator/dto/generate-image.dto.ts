import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateImageDto {
  @ApiProperty({ example: 'coffee latte on wooden table' })
  @IsString() @IsNotEmpty() description: string;

  @ApiProperty({ enum: ['minimalist', 'colorful', 'professional', 'fun'], default: 'professional' })
  @IsEnum(['minimalist', 'colorful', 'professional', 'fun']) style: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional() brandName?: string;

  @ApiProperty({ 
    required: false,
    enum: ['cosmetics', 'beauty', 'sports', 'fashion', 'food', 'technology', 'lifestyle'],
    description: 'Catégorie du produit pour améliorer la recherche'
  })
  @IsString() @IsOptional() category?: string;
}

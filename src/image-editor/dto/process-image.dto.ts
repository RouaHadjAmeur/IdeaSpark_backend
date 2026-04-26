import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageFilter, ImageFrame, ImageEffect } from '../schemas/edited-image.schema';

export class TextOverlayDto {
  @IsString()
  text: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  y: number;

  @IsNumber()
  @Min(8)
  @Max(200)
  fontSize: number;

  @IsNumber()
  color: number;

  @IsOptional()
  bold?: boolean;

  @IsOptional()
  italic?: boolean;
}

export class ProcessImageDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsEnum(ImageFilter)
  filter?: ImageFilter;

  @IsOptional()
  @IsEnum(ImageFrame)
  frame?: ImageFrame;

  @IsOptional()
  @IsNumber()
  frameColor?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextOverlayDto)
  textOverlays?: TextOverlayDto[];

  @IsOptional()
  @IsArray()
  @IsEnum(ImageEffect, { each: true })
  effects?: ImageEffect[];

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4000)
  resizedWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4000)
  resizedHeight?: number;
}

export class ApplyFilterDto {
  @IsString()
  imageUrl: string;

  @IsEnum(ImageFilter)
  filter: ImageFilter;
}

export class AddTextDto {
  @IsString()
  imageUrl: string;

  @ValidateNested()
  @Type(() => TextOverlayDto)
  textOverlay: TextOverlayDto;
}

export class ResizeImageDto {
  @IsString()
  imageUrl: string;

  @IsNumber()
  @Min(100)
  @Max(4000)
  width: number;

  @IsNumber()
  @Min(100)
  @Max(4000)
  height: number;
}
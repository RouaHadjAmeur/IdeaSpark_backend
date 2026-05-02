import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class CreateYoutubeTrendItemDto {
  @IsString()
  platform: string;

  @IsString()
  title: string;

  @IsNumber()
  views: number;

  @IsNumber()
  likes: number;

  @IsNumber()
  comments: number;

  @IsString()
  channel: string;

  @IsUrl()
  thumbnail: string;

  @IsUrl()
  video_url: string;

  @IsDateString()
  published_at: string;

  @IsNumber()
  duration_seconds: number;

  @IsString()
  @IsIn(['short', 'long'])
  format: string;

  @IsNumber()
  engagement_rate: number;

  @IsNumber()
  virality_score: number;
}

export class CreateYoutubeTrendBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateYoutubeTrendItemDto)
  items: CreateYoutubeTrendItemDto[];
}


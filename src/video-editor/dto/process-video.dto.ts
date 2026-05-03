import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { VideoTransitionType } from '../schemas/edited-video.schema';

export class VideoMusicDto {
  @IsString()
  name: string;

  @IsString()
  path: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  volume?: number;
}

export class VideoTextOverlayDto {
  @IsString()
  text: string;

  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  @Min(0)
  endTime: number;

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

export class VideoSubtitleDto {
  @IsString()
  text: string;

  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  @Min(0)
  endTime: number;

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(200)
  fontSize?: number;

  @IsOptional()
  @IsNumber()
  color?: number;
}

export class VideoTransitionDto {
  @IsEnum(VideoTransitionType)
  type: VideoTransitionType;

  @IsNumber()
  @Min(0.1)
  @Max(5)
  duration: number;

  @IsNumber()
  @Min(0)
  position: number;
}

export class ProcessVideoDto {
  @IsString()
  videoPath: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VideoMusicDto)
  music?: VideoMusicDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoTextOverlayDto)
  textOverlays?: VideoTextOverlayDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoSubtitleDto)
  subtitles?: VideoSubtitleDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  trimStart?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trimEnd?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoTransitionDto)
  transitions?: VideoTransitionDto[];
}

export class AddMusicDto {
  @IsString()
  videoPath: string;

  @ValidateNested()
  @Type(() => VideoMusicDto)
  music: VideoMusicDto;
}

export class TrimVideoDto {
  @IsString()
  videoPath: string;

  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  @Min(0)
  endTime: number;
}
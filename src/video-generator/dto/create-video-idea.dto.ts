import { IsNotEmpty, IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ShotType } from '../schemas/video-idea.schema';

class VideoSceneDto {
    @IsNotEmpty()
    startSec: number;

    @IsNotEmpty()
    endSec: number;

    @IsEnum(ShotType)
    shotType: ShotType;

    @IsString()
    description: string;

    @IsString()
    onScreenText: string;

    @IsString()
    voiceOver: string;
}

export class CreateVideoIdeaDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    hook: string;

    @IsNotEmpty()
    @IsString()
    script: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VideoSceneDto)
    scenes: VideoSceneDto[];

    @IsNotEmpty()
    @IsString()
    cta: string;

    @IsNotEmpty()
    @IsString()
    caption: string;

    @IsArray()
    @IsString({ each: true })
    hashtags: string[];

    @IsString()
    thumbnailText: string;

    @IsString()
    filmingNotes: string;

    @IsString()
    complianceNote: string;

    @IsArray()
    @IsString({ each: true })
    suggestedLocations: string[];

    @IsArray()
    locationHooks: { location: string; hook: string }[];

    @IsString()
    productImageUrl?: string;
}

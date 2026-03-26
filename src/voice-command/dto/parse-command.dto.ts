import { IsString, IsNotEmpty, IsObject, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VoiceContextDto {
    @ApiPropertyOptional({ example: 'IDEA_LIST', description: 'Current screen the user is on' })
    @IsString()
    @IsOptional()
    screen?: string;

    @ApiPropertyOptional({ example: 5, description: 'Number of ideas currently displayed' })
    @IsInt()
    @Min(0)
    @IsOptional()
    ideasCount?: number;
}

export class ParseCommandDto {
    @ApiProperty({ example: 'save the second idea and open favorites', description: 'Transcribed voice command text' })
    @IsString()
    @IsNotEmpty()
    text: string;

    @ApiPropertyOptional({ type: VoiceContextDto, description: 'Current app context' })
    @IsObject()
    @IsOptional()
    @Type(() => VoiceContextDto)
    context?: VoiceContextDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchVideoDto {
    @ApiProperty({ description: 'The search query for the video' })
    @IsNotEmpty()
    @IsString()
    query: string;

    @ApiProperty({ description: 'Optional orientation (portrait, landscape, square)', required: false })
    @IsOptional()
    @IsString()
    orientation?: string;

    @ApiProperty({ description: 'Optional size (large, medium, small)', required: false })
    @IsOptional()
    @IsString()
    size?: string;
}

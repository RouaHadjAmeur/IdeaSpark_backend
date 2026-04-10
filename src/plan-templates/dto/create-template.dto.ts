import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() durationWeeks?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() postingFrequency?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() totalPosts?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() planId?: string;
}

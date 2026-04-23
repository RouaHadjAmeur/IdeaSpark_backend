import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['short', 'medium', 'long'])
  duration?: string;

  @IsOptional()
  @IsEnum(['portrait', 'landscape', 'square'])
  orientation?: string;
}

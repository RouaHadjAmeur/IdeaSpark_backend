import { IsString, IsNumber, IsArray, IsOptional, IsDateString, Min, IsEnum } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  brandId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  brief?: string;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsString()
  @IsEnum(['UGC', 'Testimonial', 'Product Demo', 'Unboxing', 'Other'])
  videoType: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDuration?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsNumber()
  @Min(0)
  winnerReward: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  runnerUpReward?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  submissionCap?: number;

  @IsDateString()
  deadline: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  criteria?: string[];
}

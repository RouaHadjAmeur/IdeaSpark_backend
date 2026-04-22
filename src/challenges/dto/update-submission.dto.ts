import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';

export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  status?: string; // 'submitted', 'under_review', 'shortlisted', 'revision_needed', 'winner'

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

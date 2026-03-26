import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RefinePromptDto {
  @ApiProperty({
    description: 'Prompt brut à raffiner',
    example: 'Crée un plan de contenu Instagram pour une marque de vêtements éco-responsables.',
    minLength: 1,
    maxLength: 4000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(4000)
  prompt: string;
}

export interface RefinePromptResponse {
  result: string;
}


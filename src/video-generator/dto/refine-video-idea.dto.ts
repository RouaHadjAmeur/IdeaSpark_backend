import { IsNotEmpty, IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';

export enum RefinementType {
    Emotion = 'emotion',
    Aggressive = 'aggressive',
    Short = 'short',
    Story = 'story',
    Problem = 'problem',
    Benefits = 'benefits',
}

export class RefineVideoIdeaDto {
    @IsNotEmpty()
    @IsMongoId({ message: 'ideaId must be a valid MongoDB ObjectId' })
    ideaId: string;

    @IsOptional()
    @IsEnum(RefinementType)
    refinementType?: RefinementType;

    @IsOptional()
    @IsString()
    customInstruction?: string;
}

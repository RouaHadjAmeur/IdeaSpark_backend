import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachPlanDto {
    @ApiProperty({ description: 'Plan ID to attach this content block to' })
    @IsNotEmpty()
    @IsString()
    planId: string;

    @ApiPropertyOptional({ description: 'Embedded Phase _id inside the Plan' })
    @IsOptional()
    @IsString()
    planPhaseId?: string;

    @ApiPropertyOptional({ description: 'Human-readable phase/week label, e.g. "Week 2 — Launch"' })
    @IsOptional()
    @IsString()
    phaseLabel?: string;
}

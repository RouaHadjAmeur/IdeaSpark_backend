import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleDto {
    @ApiProperty({
        description: 'ISO 8601 date-time when this content is scheduled to be published.',
        example: '2026-03-15T10:00:00.000Z',
    })
    @IsNotEmpty()
    @IsDateString()
    scheduledAt: string;
}

import { IsEnum, IsNotEmpty } from 'class-validator';
import { ContentBlockStatus } from '../schemas/plan.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBlockStatusDto {
    @ApiProperty({ enum: ContentBlockStatus })
    @IsEnum(ContentBlockStatus)
    @IsNotEmpty()
    status: ContentBlockStatus;
}

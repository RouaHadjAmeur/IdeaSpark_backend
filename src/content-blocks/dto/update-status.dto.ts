import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContentBlockStatus } from '../schemas/content-block.schema';

export class UpdateStatusDto {
    @ApiProperty({
        enum: ContentBlockStatus,
        description: 'New status. Must follow allowed transitions: idea→approved→scheduled→in_process; any→terminated.',
    })
    @IsEnum(ContentBlockStatus)
    status: ContentBlockStatus;
}

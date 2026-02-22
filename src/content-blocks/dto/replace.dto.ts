import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplaceDto {
    @ApiProperty({
        description: 'ID of the target ContentBlock whose title/hooks/script will be overwritten. Its scheduledAt and status are preserved.',
    })
    @IsNotEmpty()
    @IsString()
    targetId: string;
}

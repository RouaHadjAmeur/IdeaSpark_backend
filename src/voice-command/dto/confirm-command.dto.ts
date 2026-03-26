import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmCommandDto {
    @ApiProperty({ example: 'delete:2', description: 'Confirmation key from the parse response' })
    @IsString()
    @IsNotEmpty()
    confirmationKey: string;

    @ApiProperty({ example: 'confirm', description: 'User spoken confirmation text' })
    @IsString()
    @IsNotEmpty()
    text: string;
}

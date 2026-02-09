import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FacebookVerifyDto {
    @ApiProperty({
        description: 'Facebook access token from the mobile app',
        example: 'EAAGm0PX4ZCps8BA...',
    })
    @IsString()
    @IsNotEmpty({ message: 'accessToken is required' })
    accessToken: string;

    @ApiProperty({
        description: '6-digit verification code sent by email',
        example: '123456',
    })
    @IsString()
    @Length(6, 6, { message: 'Code must be 6 digits' })
    code: string;
}

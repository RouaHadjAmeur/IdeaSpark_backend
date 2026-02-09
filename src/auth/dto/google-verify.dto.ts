import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleVerifyDto {
    @ApiProperty({
        description: 'Google ID token from the mobile app',
        example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    @IsNotEmpty({ message: 'idToken is required' })
    idToken: string;

    @ApiProperty({
        description: '6-digit verification code sent by email',
        example: '123456',
    })
    @IsString()
    @Length(6, 6, { message: 'Code must be 6 digits' })
    code: string;
}

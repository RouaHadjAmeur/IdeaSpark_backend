import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleTokenDto {
    @ApiProperty({
        description: 'Google ID token from the mobile app (e.g. from google_sign_in)',
        example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    @IsNotEmpty({ message: 'idToken is required' })
    idToken: string;
}

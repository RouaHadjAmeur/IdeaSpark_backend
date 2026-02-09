import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FacebookTokenDto {
    @ApiProperty({
        description: 'Facebook access token from the mobile app (e.g. from flutter_facebook_auth)',
        example: 'EAAGm0PX4ZCps8BA...',
    })
    @IsString()
    @IsNotEmpty({ message: 'accessToken is required' })
    accessToken: string;
}

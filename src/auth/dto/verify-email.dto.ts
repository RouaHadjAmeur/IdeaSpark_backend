import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '6-digit verification code sent by email', example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  code: string;
}

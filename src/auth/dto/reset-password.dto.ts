import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ description: '6-digit code sent by email', example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  code: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'NewSecurePass123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

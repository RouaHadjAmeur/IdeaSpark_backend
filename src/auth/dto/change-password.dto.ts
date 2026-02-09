import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'CurrentPass123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'NewSecurePass123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

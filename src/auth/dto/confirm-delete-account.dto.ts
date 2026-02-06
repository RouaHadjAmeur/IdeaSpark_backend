import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmDeleteAccountDto {
  @ApiProperty({ description: '6-digit code sent by email to confirm account deletion', example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  code: string;
}

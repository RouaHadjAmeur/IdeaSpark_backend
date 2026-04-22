import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Customer email for Stripe record', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Customer display name', example: 'Jane Doe' })
  @IsString()
  name: string;
}

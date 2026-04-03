import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTokenDto {
  @ApiProperty() @IsString() @IsNotEmpty() fcmToken: string;
  @ApiProperty({ enum: ['android', 'ios'] }) @IsEnum(['android', 'ios']) platform: string;
}

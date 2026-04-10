import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleNotificationDto {
  @ApiProperty() @IsString() @IsNotEmpty() planId: string;
  @ApiProperty() @IsDateString() scheduledAt: string;
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() body: string;
}

import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddHistoryDto {
  @ApiProperty() @IsString() @IsNotEmpty() action: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
}

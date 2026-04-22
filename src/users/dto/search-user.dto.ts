import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchUserDto {
  @ApiProperty({
    description: 'Recherche par nom ou email',
    required: false,
    example: 'John',
  })
  @IsOptional()
  @IsString()
  query?: string;
}

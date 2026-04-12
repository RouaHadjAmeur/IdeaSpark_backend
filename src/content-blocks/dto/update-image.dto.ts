import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class UpdateImageDto {
  @ApiProperty({
    description: 'URL of the generated image',
    example: 'https://images.unsplash.com/photo-1234567890',
  })
  @IsString()
  @IsUrl()
  imageUrl: string;
}

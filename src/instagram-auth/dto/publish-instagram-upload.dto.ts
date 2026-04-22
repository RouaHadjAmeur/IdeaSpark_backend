import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class PublishInstagramUploadDto {
  @IsIn(['image', 'video', 'reel'])
  mediaType: 'image' | 'video' | 'reel';

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  @IsBoolean()
  shareToFeed?: boolean;
}



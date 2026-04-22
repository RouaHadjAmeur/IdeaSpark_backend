import { IsBoolean, IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class PublishInstagramDto {
  @IsIn(['image', 'video', 'reel'])
  mediaType: 'image' | 'video' | 'reel';

  @IsUrl()
  mediaUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @IsBoolean()
  shareToFeed?: boolean;
}


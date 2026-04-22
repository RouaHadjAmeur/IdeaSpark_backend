import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class PublishYoutubeDto {
  @IsUrl()
  videoUrl: string;

  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsIn(['private', 'unlisted', 'public'])
  privacyStatus?: 'private' | 'unlisted' | 'public';
}


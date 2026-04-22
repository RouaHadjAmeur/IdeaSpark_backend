import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class PublishYoutubeUploadDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  tagsCsv?: string;

  @IsOptional()
  @IsIn(['private', 'unlisted', 'public'])
  privacyStatus?: 'private' | 'unlisted' | 'public';
}


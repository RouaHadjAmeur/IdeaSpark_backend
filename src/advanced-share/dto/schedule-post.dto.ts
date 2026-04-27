import { IsString, IsArray, IsEnum, IsDateString, IsOptional, IsUrl } from 'class-validator';
import { SocialPlatform } from '../schemas/scheduled-post.schema';

export class SchedulePostDto {
  @IsString()
  contentId: string;

  @IsEnum(['image', 'video'])
  contentType: string;

  @IsUrl()
  contentUrl: string;

  @IsString()
  caption: string;

  @IsArray()
  @IsString({ each: true })
  hashtags: string[];

  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  platforms: SocialPlatform[];

  @IsArray()
  @IsString({ each: true })
  accountIds: string[];

  @IsDateString()
  scheduledTime: string;
}

export class ShareNowDto {
  @IsString()
  contentId: string;

  @IsEnum(['image', 'video'])
  contentType: string;

  @IsUrl()
  contentUrl: string;

  @IsString()
  caption: string;

  @IsArray()
  @IsString({ each: true })
  hashtags: string[];

  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  platforms: SocialPlatform[];

  @IsArray()
  @IsString({ each: true })
  accountIds: string[];
}

export class ConnectAccountDto {
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  platformUserId?: string;
}

export class GenerateHashtagsDto {
  @IsString()
  content: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;
}
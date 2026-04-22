import { IsOptional, IsUrl, MaxLength } from 'class-validator';

export class StartYoutubeOauthDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  appRedirectUri?: string;
}


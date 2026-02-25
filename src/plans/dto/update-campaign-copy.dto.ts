import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCampaignCopyDto {
    @ApiPropertyOptional({ description: 'The chosen campaign slogan to attach to this plan', example: 'Hydrate Smarter. Live Better.' })
    @IsOptional()
    @IsString()
    campaignSlogan?: string;

    @ApiPropertyOptional({ description: 'The chosen launch headline variant', example: 'Introducing the Water Bottle That Thinks for You' })
    @IsOptional()
    @IsString()
    launchHeadline?: string;
}

import { IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
    UserType,
    MainGoal,
    Niche,
    MainPlatform,
    FrequentPlatform,
    ContentStyle,
    PreferredTone,
    MainAudience,
    AudienceAge,
    Language,
    CTA,
} from '../schemas/persona.schema';

export class CreatePersonaDto {
    @ApiProperty({
        description: 'User type / profession',
        enum: UserType,
        example: 'Influenceur',
    })
    @IsEnum(UserType)
    userType: UserType;

    @ApiProperty({
        description: 'Main content goal',
        enum: MainGoal,
        example: 'Vendre',
    })
    @IsEnum(MainGoal)
    mainGoal: MainGoal;

    @ApiProperty({
        description: 'Content niches (multiple selection)',
        enum: Niche,
        isArray: true,
        example: ['E-commerce', 'Business'],
    })
    @IsArray()
    @IsEnum(Niche, { each: true })
    niches: Niche[];

    @ApiProperty({
        description: 'Main platform for posting content',
        enum: MainPlatform,
        example: 'TikTok',
    })
    @IsEnum(MainPlatform)
    mainPlatform: MainPlatform;

    @ApiProperty({
        description: 'Platforms used frequently',
        enum: FrequentPlatform,
        isArray: true,
        example: ['TikTok', 'Instagram'],
    })
    @IsArray()
    @IsEnum(FrequentPlatform, { each: true })
    frequentPlatforms: FrequentPlatform[];

    @ApiProperty({
        description: 'Content creation styles (multiple selection)',
        enum: ContentStyle,
        isArray: true,
        example: ['Facecam', 'Voice-over'],
    })
    @IsArray()
    @IsEnum(ContentStyle, { each: true })
    contentStyles: ContentStyle[];

    @ApiProperty({
        description: 'Preferred content tone',
        enum: PreferredTone,
        example: 'Fun',
    })
    @IsEnum(PreferredTone)
    preferredTone: PreferredTone;

    @ApiProperty({
        description: 'Target audiences (multiple selection)',
        enum: MainAudience,
        isArray: true,
        example: ['Jeunes actifs', 'Entrepreneurs'],
    })
    @IsArray()
    @IsEnum(MainAudience, { each: true })
    audiences: MainAudience[];

    @ApiProperty({
        description: 'Target audience age range',
        enum: AudienceAge,
        example: '18–24',
    })
    @IsEnum(AudienceAge)
    audienceAge: AudienceAge;

    @ApiProperty({
        description: 'Preferred content language',
        enum: Language,
        example: 'FR',
    })
    @IsEnum(Language)
    language: Language;

    @ApiProperty({
        description: 'Preferred call-to-actions (multiple selection)',
        enum: CTA,
        isArray: true,
        example: ['Lien en bio', 'Abonne-toi'],
    })
    @IsArray()
    @IsEnum(CTA, { each: true })
    preferredCTAs: CTA[];
}

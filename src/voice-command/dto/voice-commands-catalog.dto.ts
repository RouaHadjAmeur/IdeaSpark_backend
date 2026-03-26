import { ApiProperty } from '@nestjs/swagger';

export class RouteEntryDto {
    @ApiProperty({ example: 'BRANDS', description: 'Canonical destination name (what the backend returns to Flutter)' })
    name: string;

    @ApiProperty({
        example: ['brands', 'brand page', 'my brands'],
        description: 'Natural-language phrases that resolve to this route',
        type: [String],
    })
    aliases: string[];
}

export class IntentEntryDto {
    @ApiProperty({ example: 'NAVIGATE', description: 'Intent identifier' })
    intent: string;

    @ApiProperty({ example: 'Navigate to a screen in the app', description: 'What this intent does' })
    description: string;

    @ApiProperty({
        example: ['Go to profile', 'Open my brands', 'Take me to plans'],
        description: 'Example voice phrases that trigger this intent',
        type: [String],
    })
    examples: string[];
}

export class VoiceCommandsCatalogDto {
    @ApiProperty({ type: [IntentEntryDto], description: 'All supported voice intents' })
    intents: IntentEntryDto[];

    @ApiProperty({ type: [RouteEntryDto], description: 'All navigable routes and their accepted aliases' })
    routes: RouteEntryDto[];
}

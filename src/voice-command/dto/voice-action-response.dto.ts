import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * A single validated action returned to Flutter.
 *
 * Invariants enforced by the backend before this reaches the client:
 *  - `destination` is ALWAYS a canonical route name from APP_ROUTES (never raw speech).
 *  - `destinationText` is NEVER present — it is an internal LLM extraction field only.
 */
export class VoiceActionDto {
    @ApiProperty({
        example: 'NAVIGATE',
        description: 'Intent of the action. One of: GENERATE_IDEA, SAVE_IDEA, UNSAVE_IDEA, NAVIGATE, READ_IDEA, DELETE_IDEA, GO_BACK',
    })
    intent: string;

    @ApiPropertyOptional({
        example: 'PROFILE',
        description:
            'Canonical destination route (NAVIGATE intent only). Always a validated value from the server route registry — never raw user speech.',
    })
    destination?: string;

    @ApiPropertyOptional({ example: 2, description: 'Idea index (for SAVE_IDEA, UNSAVE_IDEA, READ_IDEA, DELETE_IDEA)' })
    index?: number;

    @ApiPropertyOptional({ example: 'sustainable fashion', description: 'Idea topic (for GENERATE_IDEA)' })
    topic?: string;
}

export class ParseResultDto {
    @ApiProperty({ type: [VoiceActionDto], description: 'Validated actions to execute. Empty array means nothing to do.' })
    actions: VoiceActionDto[];

    @ApiProperty({ example: false, description: 'True when the user must confirm before the action executes.' })
    requiresConfirmation: boolean;

    @ApiPropertyOptional({
        example: 'delete:2',
        description: 'Opaque key to pass to /api/voice/confirm when requiresConfirmation is true.',
    })
    confirmationKey?: string;

    @ApiProperty({ example: 'Opening profile.', description: 'Human-readable response to speak to the user via TTS.' })
    say: string;
}

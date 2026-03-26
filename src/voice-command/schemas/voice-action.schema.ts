import { z } from 'zod';
import { ROUTE_NAMES } from '../route-registry';

// ── Strict intent enum ──

export const VoiceIntent = z.enum([
    'GENERATE_IDEA',
    'SAVE_IDEA',
    'UNSAVE_IDEA',
    'NAVIGATE',
    'READ_IDEA',
    'DELETE_IDEA',
    'GO_BACK',
]);

/**
 * NavigationDestination stays derived from the route registry.
 * This is the validated canonical value — never comes directly from LLM.
 */
export const NavigationDestination = z.enum(ROUTE_NAMES);

// ── Raw LLM output schema ──────────────────────────────────────────────────────
// The LLM returns destinationText (raw speech fragment).
// Backend resolves it to a canonical destination via the route registry.

export const LlmVoiceActionSchema = z.object({
    intent: VoiceIntent,
    index: z.number().int().positive().optional(),
    /** Raw, unvalidated destination string exactly as the LLM extracted it from speech. */
    destinationText: z.string().optional(),
    topic: z.string().optional(),
});

export const LlmVoiceActionsResponseSchema = z.object({
    actions: z.array(LlmVoiceActionSchema),
});

export type LlmVoiceAction = z.infer<typeof LlmVoiceActionSchema>;

// ── Final validated action schema (returned to Flutter) ───────────────────────
// destination is always a canonical route name — resolved and validated by backend.

export const VoiceActionSchema = z.object({
    intent: VoiceIntent,
    index: z.number().int().positive().optional(),
    /** Canonical route name — always validated against the route registry. */
    destination: NavigationDestination.optional(),
    topic: z.string().optional(),
});

export const VoiceActionsResponseSchema = z.object({
    actions: z.array(VoiceActionSchema),
});

export type VoiceAction = z.infer<typeof VoiceActionSchema>;

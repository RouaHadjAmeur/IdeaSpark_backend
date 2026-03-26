import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
    LlmVoiceAction,
    LlmVoiceActionsResponseSchema,
    VoiceAction,
} from './schemas/voice-action.schema';
import { APP_ROUTES, resolveRoute, isValidRoute } from './route-registry';
import { VoiceCommandsCatalogDto } from './dto/voice-commands-catalog.dto';

export interface ParseResult {
    actions: VoiceAction[];
    requiresConfirmation: boolean;
    confirmationKey?: string;
    say: string;
}

export interface ConfirmResult {
    confirmed: boolean;
    actions?: VoiceAction[];
    say: string;
}

@Injectable()
export class VoiceCommandService {
    private readonly logger = new Logger(VoiceCommandService.name);
    constructor() {}

    async parse(
        text: string,
        context?: { screen?: string; ideasCount?: number },
    ): Promise<ParseResult> {
        let rawActions: LlmVoiceAction[] = [];

        try {
            rawActions = await this.callLlm(text, context);
        } catch (err) {
            this.logger.warn('LLM call failed, falling back to deterministic parser', err);
            return this.postProcess(this.fallbackParse(text, context));
        }

        // Step 4 — Backend validates every NAVIGATE destination.
        // LLM never decides the final route; it only extracts destinationText.
        const actions: VoiceAction[] = [];
        for (const raw of rawActions) {
            if (raw.intent === 'NAVIGATE') {
                const resolved = this.resolveDestination(raw.destinationText ?? '');
                if (!resolved) {
                    this.logger.warn(
                        `Unresolvable destinationText "${raw.destinationText}" — returning empty actions`,
                    );
                    return { actions: [], requiresConfirmation: false, say: "I couldn't find that screen." };
                }
                actions.push({ intent: 'NAVIGATE', destination: resolved as VoiceAction['destination'] });
            } else {
                // Strip destinationText — it must never reach Flutter
                const { destinationText: _dt, ...rest } = raw;
                actions.push(rest as VoiceAction);
            }
        }

        console.log('FINAL ACTIONS SENT TO FLUTTER:', actions);
        return this.postProcess(actions);
    }

    getCommandsCatalog(): VoiceCommandsCatalogDto {
        return {
            intents: [
                {
                    intent: 'NAVIGATE',
                    description: 'Navigate to a screen in the app',
                    examples: ['Go to profile', 'Open my brands', 'Take me to plans', 'Navigate to content blocks'],
                },
                {
                    intent: 'GENERATE_IDEA',
                    description: 'Generate a new idea, optionally on a topic',
                    examples: ['Generate an idea', 'New idea about sustainable fashion', 'Create idea for my brand'],
                },
                {
                    intent: 'SAVE_IDEA',
                    description: 'Save an idea by position',
                    examples: ['Save the first idea', 'Save idea 2', 'Save the last one'],
                },
                {
                    intent: 'UNSAVE_IDEA',
                    description: 'Remove an idea from saved',
                    examples: ['Unsave the second idea', 'Remove idea 3 from saved'],
                },
                {
                    intent: 'READ_IDEA',
                    description: 'Read an idea aloud',
                    examples: ['Read the first idea', 'Read idea 2'],
                },
                {
                    intent: 'DELETE_IDEA',
                    description: 'Delete an idea (requires confirmation)',
                    examples: ['Delete the third idea', 'Remove idea 1'],
                },
                {
                    intent: 'GO_BACK',
                    description: 'Go back to the previous screen',
                    examples: ['Go back', 'Back'],
                },
            ],
            routes: APP_ROUTES.map((r) => ({ name: r.name, aliases: r.aliases })),
        };
    }

    confirm(confirmationKey: string, text: string): ConfirmResult {
        const normalised = text.toLowerCase().trim();
        const positiveWords = ['confirm', 'yes', 'oui', 'نعم'];
        const isConfirmed = positiveWords.some((w) => normalised.includes(w));

        if (!isConfirmed) {
            return { confirmed: false, say: 'Cancelled.' };
        }

        const parts = confirmationKey.split(':');
        const intent = parts[0];
        const index = parseInt(parts[1], 10);

        if (intent === 'delete' && !isNaN(index)) {
            return {
                confirmed: true,
                actions: [{ intent: 'DELETE_IDEA', index }],
                say: `Idea ${index} deleted.`,
            };
        }

        return { confirmed: false, say: 'Invalid confirmation key.' };
    }

    // ── Step 3 — Destination resolver ──────────────────────────────────────────
    // Owned by the backend. Exact canonical-name or exact-alias matching only.
    // Substring guessing is intentionally excluded here; use the fallback parser
    // (which calls resolveRoute) for that looser matching path.

    private resolveDestination(destinationText: string): string | null {
        const normalized = destinationText.toLowerCase().trim();

        const match = APP_ROUTES.find(
            (route) =>
                route.name.toLowerCase() === normalized ||
                route.aliases.includes(normalized),
        );

        return match ? match.name : null;
    }

    // ── LLM call ───────────────────────────────────────────────────────────────
    // Returns raw LlmVoiceAction[]. Resolution is done in parse() above.

    private async callLlm(
        text: string,
        context?: { screen?: string; ideasCount?: number },
    ): Promise<LlmVoiceAction[]> {
        const systemPrompt = `You are a strict JSON command parser for a mobile app called IdeaSpark.
You MUST output ONLY valid JSON.
Do NOT add explanations.
Do NOT add text before or after JSON.
If the command is unclear, output:
{ "actions": [] }`;

        const userPrompt = `Convert the following voice command into structured actions.

Allowed intents:
- GENERATE_IDEA (topic?: string)
- SAVE_IDEA (index?: integer)
- UNSAVE_IDEA (index?: integer)
- NAVIGATE (destinationText: the exact screen or section name the user said)
- READ_IDEA (index?: integer)
- DELETE_IDEA (index?: integer)
- GO_BACK

Rules:
- 'first' = index 1
- 'second' = index 2
- 'third' = index 3
- 'last idea' = use ideasCount from context (${context?.ideasCount ?? 'unknown'})
- For NAVIGATE, copy the destination phrase exactly as the user said it into destinationText
- Do NOT validate or transform destinationText — output the raw phrase
- If index out of range, return { "actions": [] }
- If unclear, return { "actions": [] }

Command:
"${text}"

Output format:
{
  "actions": [
    {
      "intent": "INTENT_NAME",
      "index": optional integer,
      "destinationText": "optional raw destination phrase for NAVIGATE",
      "topic": optional string
    }
  ]
}`;

        const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
            model: 'mistral',
            prompt: `${systemPrompt}\n\n${userPrompt}`,
            stream: false,
        });

        console.log('---- OLLAMA RAW RESPONSE ----');
        console.log(ollamaResponse.data);
        console.log('-----------------------------');

        const modelOutput = ollamaResponse.data.response;
        console.log('MODEL TEXT OUTPUT:', modelOutput);

        return this.parseLlmResponse(modelOutput || '');
    }

    private parseLlmResponse(text: string): LlmVoiceAction[] {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return [];

            const data = JSON.parse(jsonMatch[0]);
            console.log('PARSED JSON:', data);
            const validated = LlmVoiceActionsResponseSchema.safeParse(data);
            if (!validated.success) {
                this.logger.error('LLM JSON failed Zod validation', validated.error.format());
                throw new Error('Invalid LLM output');
            }
            return validated.data.actions;
        } catch (err) {
            this.logger.error('Failed to parse LLM JSON', err);
            throw new Error('Invalid LLM output');
        }
    }

    // ── Fallback parser ────────────────────────────────────────────────────────
    // Used when LLM is unavailable. Uses resolveRoute (alias + substring) for
    // broader coverage since we can't rely on clean LLM extraction here.

    private fallbackParse(text: string, context?: { ideasCount?: number }): VoiceAction[] {
        const actions: VoiceAction[] = [];
        const lowerText = text.toLowerCase();

        // Index extraction
        let index: number | undefined;
        if (lowerText.includes('first')) index = 1;
        else if (lowerText.includes('second')) index = 2;
        else if (lowerText.includes('third')) index = 3;
        else if (lowerText.includes('last') && context?.ideasCount) index = context.ideasCount;
        else {
            const match = lowerText.match(/\b(\d+)\b/);
            if (match) index = parseInt(match[1], 10);
        }

        // Navigation — keyword detection then registry lookup
        const navKeywords = ['go to', 'open', 'navigate to', 'take me to', 'show', 'show me'];
        const hasNavKeyword = navKeywords.some((kw) => lowerText.includes(kw)) || lowerText.startsWith('go ');

        if (hasNavKeyword || lowerText.includes('back')) {
            if (lowerText.includes('back')) {
                actions.push({ intent: 'GO_BACK' });
                return actions;
            }

            let phrase = lowerText;
            for (const kw of navKeywords) {
                phrase = phrase.replace(kw, '').trim();
            }

            const resolved = resolveRoute(phrase); // alias + substring matching
            if (resolved && isValidRoute(resolved)) {
                actions.push({ intent: 'NAVIGATE', destination: resolved as VoiceAction['destination'] });
                return actions;
            }
        }

        // Non-navigation intents
        if (lowerText.includes('save') && !lowerText.includes('unsave')) {
            actions.push({ intent: 'SAVE_IDEA', index });
        } else if (lowerText.includes('unsave')) {
            actions.push({ intent: 'UNSAVE_IDEA', index });
        } else if (lowerText.includes('delete') || lowerText.includes('remove')) {
            actions.push({ intent: 'DELETE_IDEA', index });
        } else if (lowerText.includes('generate') || lowerText.includes('new idea')) {
            const topicMatch = lowerText.match(/(?:about|for|on)\s+(.+)$/);
            actions.push({ intent: 'GENERATE_IDEA', topic: topicMatch ? topicMatch[1] : undefined });
        } else if (lowerText.includes('read')) {
            actions.push({ intent: 'READ_IDEA', index });
        } else {
            // Last resort — bare phrase resolution (e.g. "brands", "video")
            const resolved = resolveRoute(lowerText);
            if (resolved && isValidRoute(resolved)) {
                actions.push({ intent: 'NAVIGATE', destination: resolved as VoiceAction['destination'] });
            }
        }

        return actions;
    }

    // ── Post-process ───────────────────────────────────────────────────────────

    private postProcess(actions: VoiceAction[]): ParseResult {
        // Safety net: drop any NAVIGATE that somehow slipped through without a valid destination
        const safeActions = actions.filter((a) => {
            if (a.intent === 'NAVIGATE' && (!a.destination || !isValidRoute(a.destination))) {
                this.logger.warn(`Dropped NAVIGATE action with invalid destination: "${a.destination}"`);
                return false;
            }
            return true;
        });

        const deleteAction = safeActions.find((a) => a.intent === 'DELETE_IDEA');
        if (deleteAction && deleteAction.index) {
            return {
                actions: [],
                requiresConfirmation: true,
                confirmationKey: `delete:${deleteAction.index}`,
                say: `You are about to delete idea ${deleteAction.index}. Say confirm.`,
            };
        }

        let say = 'OK.';
        if (safeActions.length > 0) {
            const first = safeActions[0];
            if (first.intent === 'GENERATE_IDEA') say = 'Generating idea.';
            if (first.intent === 'NAVIGATE') say = `Opening ${first.destination?.toLowerCase().replace(/_/g, ' ')}.`;
            if (first.intent === 'GO_BACK') say = 'Going back.';
            if (first.intent === 'READ_IDEA') say = `Reading idea ${first.index ?? ''}.`.trim();
            if (first.intent === 'SAVE_IDEA') say = `Saving idea ${first.index ?? ''}.`.trim();
            if (first.intent === 'UNSAVE_IDEA') say = `Removing idea ${first.index ?? ''} from saved.`.trim();
        }

        return { actions: safeActions, requiresConfirmation: false, say };
    }
}

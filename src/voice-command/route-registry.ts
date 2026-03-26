/**
 * Central Route Registry — single source of truth for all navigable screens.
 *
 * Rules:
 *  - `name`    : canonical route key sent to Flutter. MUST be UPPER_SNAKE_CASE.
 *  - `aliases` : all natural-language phrases (lowercase) that map to this route.
 *                Include synonyms, partial phrases, and common misspellings.
 *  - Adding a new screen = add one entry here. Nothing else needs to change.
 */

export interface AppRoute {
    /** Canonical identifier returned to Flutter */
    name: string;
    /** Lower-case natural-language phrases accepted from voice / LLM */
    aliases: string[];
}

export const APP_ROUTES: AppRoute[] = [
    {
        name: 'HOME',
        aliases: ['home', 'dashboard', 'main', 'main screen', 'start'],
    },
    {
        name: 'FAVORITES',
        aliases: ['favorites', 'favourite', 'favourites', 'saved', 'saved ideas', 'my saved', 'my favorites'],
    },
    {
        name: 'GENERATOR',
        aliases: ['generator', 'idea generator', 'generate', 'ideas', 'idea', 'create idea'],
    },
    {
        name: 'SETTINGS',
        aliases: ['settings', 'setting', 'preferences', 'options', 'config'],
    },
    {
        name: 'PROFILE',
        aliases: ['profile', 'account', 'my account', 'my profile', 'user profile'],
    },
    {
        name: 'PLANS',
        aliases: ['plans', 'plan', 'strategy', 'strategies', 'marketing plan', 'marketing plans', 'my plans'],
    },
    {
        name: 'BRANDS',
        aliases: ['brands', 'brand', 'brand page', 'my brands', 'my brand', 'branding'],
    },
    {
        name: 'CONTENT_BLOCKS',
        aliases: ['content blocks', 'content block', 'content', 'blocks', 'my content'],
    },
    {
        name: 'PERSONA',
        aliases: ['persona', 'personas', 'my persona', 'audience', 'target audience'],
    },
    {
        name: 'SLOGAN_GENERATOR',
        aliases: ['slogan', 'slogans', 'slogan generator', 'tagline', 'taglines', 'generate slogan'],
    },
    {
        name: 'VIDEO_GENERATOR',
        aliases: ['video', 'videos', 'video ideas', 'video generator', 'video suggestions', 'generate video'],
    },
];

// ── Derived helpers ────────────────────────────────────────────────────────────

/** All valid canonical route names as a plain array (used for Zod enum). */
export const ROUTE_NAMES = APP_ROUTES.map((r) => r.name) as [string, ...string[]];

/**
 * Resolve a raw alias string (from LLM or fallback parser) to its canonical
 * route name. Returns `null` when no match is found.
 *
 * Matching strategy (in order):
 *  1. Exact canonical name match  (e.g. "BRANDS")
 *  2. Exact alias match           (e.g. "brand page")
 *  3. Substring alias match       (e.g. "open brand page now")
 */
export function resolveRoute(raw: string): string | null {
    if (!raw) return null;
    const normalised = raw.toLowerCase().trim();

    for (const route of APP_ROUTES) {
        // 1. Exact canonical (case-insensitive)
        if (normalised === route.name.toLowerCase()) return route.name;

        // 2. Exact alias
        if (route.aliases.includes(normalised)) return route.name;
    }

    for (const route of APP_ROUTES) {
        // 3. Substring alias — alias is contained in the raw phrase
        if (route.aliases.some((alias) => normalised.includes(alias))) return route.name;
    }

    return null;
}

/**
 * Returns true when the given string is a valid canonical route name.
 */
export function isValidRoute(name: string): boolean {
    return APP_ROUTES.some((r) => r.name === name);
}

/**
 * Build the comma-separated destination list for LLM prompts.
 * Example: "HOME | FAVORITES | GENERATOR | …"
 */
export function routeListForPrompt(): string {
    return ROUTE_NAMES.join(' | ');
}

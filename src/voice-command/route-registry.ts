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
    // ── Auth & Onboarding ───────────────────────────────────────────────────
    {
        name: 'SPLASH',
        aliases: ['splash', 'splash screen', 'start screen', 'loading visual'],
    },
    {
        name: 'ONBOARDING',
        aliases: ['onboarding', 'welcome', 'getting started', 'intro'],
    },
    {
        name: 'PERSONA',
        aliases: ['persona', 'personas', 'my persona', 'audience', 'target audience', 'persona onboarding'],
    },
    {
        name: 'LOGIN',
        aliases: ['login', 'log in', 'sign in'],
    },
    {
        name: 'SIGNUP',
        aliases: ['signup', 'sign up', 'register', 'create account'],
    },
    {
        name: 'FORGOT_PASSWORD',
        aliases: ['forgot password', 'reset password', 'recover password'],
    },
    {
        name: 'VERIFY_EMAIL',
        aliases: ['verify email', 'email verification'],
    },

    // ── Main Navigation (bottom nav / sidebar) ──────────────────────────────
    {
        name: 'HOME',
        aliases: ['home', 'dashboard', 'main', 'main screen', 'start'],
    },
    {
        name: 'BRANDS',
        aliases: ['brands', 'brand', 'brand page', 'my brands', 'my brand', 'branding', 'brands list'],
    },
    {
        name: 'CALENDAR',
        aliases: ['calendar', 'schedule', 'planning calendar', 'timetable'],
    },
    {
        name: 'PROJECTS',
        aliases: ['execution hub', 'projects', 'my projects', 'project hub'],
    },
    {
        name: 'INSIGHTS',
        aliases: ['insights', 'analytics', 'statistics', 'stats', 'reports', 'my insights'],
    },
    {
        name: 'FAVORITES',
        aliases: ['favorites', 'favourite', 'favourites', 'saved', 'saved ideas', 'my saved', 'my favorites'],
    },
    {
        name: 'HISTORY',
        aliases: ['history', 'my history', 'past ideas', 'recent', 'recent ideas'],
    },
    {
        name: 'PROFILE',
        aliases: ['profile', 'account', 'my account', 'my profile', 'user profile'],
    },

    // ── Generator Screens ────────────────────────────────────────────────────
    {
        name: 'GENERATOR',
        aliases: ['generator', 'idea generator', 'generate', 'ideas', 'idea', 'create idea', 'criteria selection', 'criteria'],
    },
    {
        name: 'RESULTS',
        aliases: ['results', 'generator results', 'idea results'],
    },
    {
        name: 'IDEA_DETAIL',
        aliases: ['idea detail', 'idea details', 'view idea', 'open idea'],
    },
    {
        name: 'VIDEO_GENERATOR',
        aliases: ['video', 'videos', 'video ideas', 'video generator', 'video suggestions', 'generate video', 'video ideas form'],
    },
    {
        name: 'VIDEO_IDEAS_RESULTS',
        aliases: ['video ideas results', 'video results'],
    },
    {
        name: 'BUSINESS_IDEAS_FORM',
        aliases: ['business ideas', 'business generator', 'business ideas form', 'generate business ideas', 'new business idea'],
    },
    {
        name: 'BUSINESS_IDEA_DETAIL',
        aliases: ['business idea detail', 'business idea details', 'view business idea'],
    },
    {
        name: 'PRODUCT_IDEAS_FORM',
        aliases: ['product ideas', 'product generator', 'product ideas form', 'generate product ideas', 'new product idea'],
    },
    {
        name: 'PRODUCT_IDEA_RESULT',
        aliases: ['product idea result', 'product results'],
    },
    {
        name: 'SLOGAN_GENERATOR',
        aliases: ['slogan', 'slogans', 'slogan generator', 'tagline', 'taglines', 'generate slogan', 'slogans form'],
    },
    {
        name: 'SLOGANS_RESULTS',
        aliases: ['slogans results', 'slogan results', 'tagline results'],
    },

    // ── Strategic Content / Brands ──────────────────────────────────────────
    {
        name: 'BRAND_WORKSPACE',
        aliases: ['brand workspace', 'workspace'],
    },
    {
        name: 'BRAND_FORM',
        aliases: ['create brand', 'edit brand', 'add brand', 'brand form', 'new brand'],
    },
    {
        name: 'PROJECT_BOARD',
        aliases: ['project board', 'board', 'kanban canvas'],
    },
    {
        name: 'PLANS',
        aliases: ['plans', 'plan', 'strategy', 'strategies', 'marketing plan', 'marketing plans', 'my plans', 'projects flow', 'plan project flow'],
    },
    {
        name: 'AI_CAMPAIGN_ROADMAP',
        aliases: ['ai campaign roadmap', 'campaign roadmap', 'roadmap'],
    },
    {
        name: 'PLAN_DETAIL',
        aliases: ['plan detail', 'plan details', 'view plan'],
    },

    // ── Other ────────────────────────────────────────────────────────────────
    {
        name: 'CONTENT_BLOCKS',
        aliases: ['content blocks', 'content block', 'content', 'blocks', 'my content', 'saved ideas library'],
    },
    {
        name: 'TRENDS',
        aliases: ['trends', 'trends analysis', 'analyze trends', 'trending'],
    },
    {
        name: 'CREDITS_SHOP',
        aliases: ['credits shop', 'credits', 'shop', 'buy credits', 'store'],
    },
    {
        name: 'PAYMENT',
        aliases: ['payment', 'checkout', 'billing'],
    },
    {
        name: 'EDIT_PROFILE',
        aliases: ['edit profile', 'update profile', 'manage profile'],
    },
    {
        name: 'SETTINGS',
        aliases: ['settings', 'setting', 'preferences', 'options', 'config'],
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

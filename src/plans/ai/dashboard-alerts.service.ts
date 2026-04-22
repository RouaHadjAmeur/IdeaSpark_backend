import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'missed' | 'upcoming' | 'health' | 'info';

export interface DashboardAlert {
    type: AlertType;
    severity: AlertSeverity;
    message: string;
}

export interface DashboardAlertContext {
    currentDateTime: string; // ISO-8601
    brands: Array<{ id: string; name: string; hasActivePlan: boolean }>;
    plans: Array<{
        id: string;
        name: string;
        brandName: string;
        status: string;
        objective: string;
        startDate: string;
        endDate: string;
        durationWeeks: number;
        promoRatio: number;
    }>;
    entries: Array<{
        planName: string;
        brandName: string;
        title: string;
        platform: string;
        format?: string;
        status: string;          // 'scheduled' | 'published' | 'cancelled'
        scheduledDate: string;   // 'YYYY-MM-DD'
        scheduledTime?: string;  // 'HH:MM'
    }>;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DashboardAlertsService {
    private readonly logger = new Logger(DashboardAlertsService.name);
    private readonly primaryModel = 'Qwen/Qwen2.5-72B-Instruct';
    private readonly fallbackModel = 'Qwen/Qwen2.5-7B-Instruct';
    private readonly apiKey: string;

    constructor(private readonly config: ConfigService) {
        this.apiKey = this.config.get<string>('HUGGING_FACE_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('HUGGING_FACE_API_KEY is not configured. AI Dashboard alerts will use deterministic fallback.');
        }
    }

    private async callHuggingFace(model: string, prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Hugging Face API key missing');
        }

        try {
            const response = await axios.post(
                'https://router.huggingface.co/novita/v3/openai/chat/completions',
                {
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1024,
                    temperature: 0.7,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            const content = response.data?.choices?.[0]?.message?.content;
            if (content) return content;
            throw new Error(`Unexpected response structure from HF: ${JSON.stringify(response.data)}`);
        } catch (error) {
            const status = error.response?.status;
            const errorMsg = error.response?.data?.error || error.message;
            this.logger.error(`Error calling Hugging Face model ${model}: [${status}] ${errorMsg}`);
            throw error;
        }
    }

    async generateAlerts(ctx: DashboardAlertContext): Promise<DashboardAlert[]> {
        // ── 1. Compute deterministic facts ────────────────────────────────────
        const now = new Date(ctx.currentDateTime);
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const todayStr = now.toISOString().slice(0, 10);

        // End of tomorrow: covers all events scheduled for "today" and "tomorrow"
        const endOfTomorrow = new Date(now);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);
        endOfTomorrow.setHours(0, 0, 0, 0);

        const missed = ctx.entries.filter(e => {
            if (e.status === 'published' || e.status === 'cancelled') return false;
            const scheduled = new Date(`${e.scheduledDate}T${e.scheduledTime ?? '00:00'}:00`);
            return scheduled < now;
        });

        const upcoming = ctx.entries.filter(e => {
            if (e.status !== 'scheduled') return false;
            const scheduled = new Date(`${e.scheduledDate}T${e.scheduledTime ?? '23:59'}:00`);
            return scheduled >= now && scheduled < endOfTomorrow;
        });

        // ── 2. Build compact prompt ────────────────────────────────────────────
        const prompt = `You are an AI coach inside a social media content scheduling app called IdeaSpark.
Current time: ${ctx.currentDateTime}

--- MISSED POSTS (scheduled time passed, not marked published) ---
${missed.length === 0 ? 'None' : missed.map(e =>
            `• "${e.title}" [${e.platform}${e.format ? '/' + e.format : ''}] plan="${e.planName}" brand="${e.brandName}" was due ${e.scheduledDate} ${e.scheduledTime ?? ''}`
        ).join('\n')}

--- UPCOMING (today + tomorrow, not yet published) ---
${upcoming.length === 0 ? 'None' : upcoming.map(e =>
            `• "${e.title}" [${e.platform}${e.format ? '/' + e.format : ''}] plan="${e.planName}" brand="${e.brandName}" at ${e.scheduledDate} ${e.scheduledTime ?? ''}`
        ).join('\n')}

--- ACTIVE PLANS ---
${ctx.plans.filter(p => p.status === 'active').map(p =>
            `• "${p.name}" brand="${p.brandName}" promoRatio=${p.promoRatio}% ends=${p.endDate}`
        ).join('\n') || 'None'}

--- BRANDS WITHOUT ACTIVE PLAN ---
${ctx.brands.filter(b => !b.hasActivePlan).map(b => `• ${b.name}`).join('\n') || 'None'}

Generate 2–5 concise, actionable alerts. Rules:
- Start each message with an emoji
- Be specific: name the post title, platform, and plan
- Missed posts: severity = "critical"
- Upcoming reminders: severity = "info"
- Health/strategy warnings: severity = "warning"
- Positive "all good": severity = "info", type = "info"
- Keep each message under 110 characters

Respond ONLY with valid JSON — no markdown, no explanation:
[{"type":"missed|upcoming|health|info","severity":"critical|warning|info","message":"..."}]`;

        // ── 3. Call AI ─────────────────────────────────────────────────────
        try {
            let raw = '';
            try {
                raw = await this.callHuggingFace(this.primaryModel, prompt);
            } catch (err) {
                this.logger.warn('Primary model failed for dashboard alerts, trying fallback...');
                raw = await this.callHuggingFace(this.fallbackModel, prompt);
            }

            raw = raw.trim();

            // Strip markdown code fences if present
            const json = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
            const parsed: DashboardAlert[] = JSON.parse(json);

            if (!Array.isArray(parsed)) throw new Error('Not an array');
            return parsed.slice(0, 5); // cap at 5
        } catch (err) {
            this.logger.warn(`AI dashboard alerts failed, using deterministic fallback. ${err.message}`);
            return this._fallback(missed, upcoming, ctx);
        }
    }

    // ── Deterministic fallback (no AI) ────────────────────────────────────────
    private _fallback(
        missed: DashboardAlertContext['entries'],
        upcoming: DashboardAlertContext['entries'],
        ctx: DashboardAlertContext,
    ): DashboardAlert[] {
        const alerts: DashboardAlert[] = [];

        for (const e of missed.slice(0, 2)) {
            alerts.push({
                type: 'missed',
                severity: 'critical',
                message: `⚠️ Missed: "${e.title}" on ${e.platform} (${e.planName}) — mark it done or reschedule.`,
            });
        }

        for (const e of upcoming.slice(0, 2)) {
            alerts.push({
                type: 'upcoming',
                severity: 'info',
                message: `📅 Due soon: "${e.title}" [${e.platform}] for "${e.planName}" at ${e.scheduledTime ?? 'today'}.`,
            });
        }

        const noBrand = ctx.brands.filter(b => !b.hasActivePlan);
        for (const b of noBrand.slice(0, 1)) {
            alerts.push({
                type: 'health',
                severity: 'warning',
                message: `🚨 "${b.name}" has no active campaign. Consider launching one.`,
            });
        }

        if (alerts.length === 0) {
            alerts.push({
                type: 'info',
                severity: 'info',
                message: '✅ All looks great! Your content strategy is on track.',
            });
        }

        return alerts;
    }
}

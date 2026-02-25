import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum N8nEvent {
    USER_REGISTERED = 'user.registered',
    USER_ACTIVATED = 'user.activated',
    SLOGAN_SAVED = 'slogan.saved',
    VIDEO_APPROVED = 'video.approved',
    CREDITS_PURCHASED = 'credits.purchased',
}

@Injectable()
export class N8nWebhookService {
    private readonly webhookUrls: Record<N8nEvent, string | undefined>;

    constructor(private readonly configService: ConfigService) {
        this.webhookUrls = {
            [N8nEvent.USER_REGISTERED]: configService.get<string>('N8N_WEBHOOK_USER_REGISTERED'),
            [N8nEvent.USER_ACTIVATED]: configService.get<string>('N8N_WEBHOOK_USER_ACTIVATED'),
            [N8nEvent.SLOGAN_SAVED]: configService.get<string>('N8N_WEBHOOK_SLOGAN_SAVED'),
            [N8nEvent.VIDEO_APPROVED]: configService.get<string>('N8N_WEBHOOK_VIDEO_APPROVED'),
            [N8nEvent.CREDITS_PURCHASED]: configService.get<string>('N8N_WEBHOOK_CREDITS_PURCHASED'),
        };
    }

    /**
     * Fire-and-forget: sends an event payload to the corresponding n8n webhook URL.
     * Silently skips if the webhook URL is not configured (safe for local dev).
     */
    emit(event: N8nEvent, payload: Record<string, unknown>): void {
        const url = this.webhookUrls[event];
        if (!url) {
            console.log(`[n8n] Webhook for "${event}" not configured — skipping.`);
            return;
        }

        const body = JSON.stringify({ event, ...payload, _timestamp: new Date().toISOString() });

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-ideaspark-secret': this.configService.get<string>('N8N_SECRET') || '',
            },
            body,
        })
            .then((res) => {
                if (!res.ok) console.warn(`[n8n] Webhook "${event}" responded with ${res.status}`);
                else console.log(`[n8n] Event "${event}" sent successfully.`);
            })
            .catch((err) => console.error(`[n8n] Failed to send event "${event}":`, err));
    }
}

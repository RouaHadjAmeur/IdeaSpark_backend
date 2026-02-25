import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { N8nWebhookService } from './n8n-webhook.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [N8nWebhookService],
    exports: [N8nWebhookService],
})
export class N8nModule { }

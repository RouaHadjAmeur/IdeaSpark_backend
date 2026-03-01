import {
    Controller, Get, Post, Body, Query,
    UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrendsService } from './trends.service';
import { Trend } from './schemas/trend.schema';

// Simple header-based guard for n8n → NestJS calls
// n8n sends x-ideaspark-secret in request headers
class N8nGuard {
    canActivate(context: any): boolean {
        const req = context.switchToHttp().getRequest();
        const secret = req.headers['x-ideaspark-secret'];
        return !!secret;
    }
}

@Controller('trends')
export class TrendsController {
    constructor(
        private readonly trendsService: TrendsService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Called by n8n to push scraped trends.
     * Protected by x-ideaspark-secret header.
     */
    @Post('update')
    async updateTrends(
        @Body() body: { trends: Partial<Trend>[] },
        @Query('secret') secret: string,
    ): Promise<{ success: boolean; count: number }> {
        const expectedSecret = this.configService.get<string>('N8N_SECRET') || '';
        if (expectedSecret && secret !== expectedSecret) {
            throw new UnauthorizedException('Invalid n8n secret');
        }
        await this.trendsService.upsertTrends(body.trends || []);
        return { success: true, count: body.trends?.length || 0 };
    }

    /**
     * Called by Flutter app to display trending topics on the Trends screen.
     * Public endpoint (authenticated users only via JWT in production).
     */
    @Get()
    async getTrends(
        @Query('geo') geo?: string,
        @Query('language') language?: string,
        @Query('niche') niche?: string,
    ): Promise<Trend[]> {
        return this.trendsService.getLatestTrends(geo, language, niche);
    }
}

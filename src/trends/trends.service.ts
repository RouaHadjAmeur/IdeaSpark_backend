import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trend, TrendDocument } from './schemas/trend.schema';

@Injectable()
export class TrendsService {
    constructor(@InjectModel(Trend.name) private trendModel: Model<TrendDocument>) { }

    /**
     * Called by n8n via POST /trends/update to push freshly scraped trends.
     * Clears old trends for the same date+geo and inserts fresh ones.
     */
    async upsertTrends(trends: Partial<Trend>[]): Promise<void> {
        if (!trends?.length) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Group by geo to clear old data efficiently
        const geos = [...new Set(trends.map((t) => (t as any).geo || 'GLOBAL'))];
        for (const geo of geos) {
            await this.trendModel.deleteMany({
                geo,
                trendDate: { $gte: today },
            });
        }

        await this.trendModel.insertMany(
            trends.map((t) => ({
                ...t,
                geo: (t as any).geo || 'GLOBAL',
                niche: (t as any).niche || 'general',
                trendDate: t.trendDate || new Date(),
            })),
        );
    }

    /**
     * Called by Flutter to display trends on the Trends screen.
     * Filters by geo and optionally by niche.
     */
    async getLatestTrends(geo?: string, language?: string, niche?: string): Promise<Trend[]> {
        const filter: any = {};
        if (geo) filter.geo = geo.toUpperCase();
        if (language) filter.language = language;
        if (niche) filter.niche = niche.toLowerCase();
        return this.trendModel.find(filter).sort({ trendDate: -1, createdAt: -1 }).limit(20).exec();
    }
}

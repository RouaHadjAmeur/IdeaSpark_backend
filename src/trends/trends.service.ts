import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trend, TrendDocument } from './schemas/trend.schema';

@Injectable()
export class TrendsService {
    constructor(@InjectModel(Trend.name) private trendModel: Model<TrendDocument>) { }

    /**
     * Called by n8n via POST /trends/update to push freshly scraped trends.
     * Clears old trends for the same date+language and inserts fresh ones.
     */
    async upsertTrends(trends: Partial<Trend>[]): Promise<void> {
        if (!trends?.length) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Group by language to clear old data efficiently
        const languages = [...new Set(trends.map((t) => t.language || 'fr'))];
        for (const lang of languages) {
            await this.trendModel.deleteMany({
                language: lang,
                trendDate: { $gte: today },
            });
        }

        await this.trendModel.insertMany(
            trends.map((t) => ({ ...t, trendDate: t.trendDate || new Date() })),
        );
    }

    /**
     * Called by Flutter to display trends on the Trends screen.
     */
    async getLatestTrends(language?: string): Promise<Trend[]> {
        const filter = language ? { language } : {};
        return this.trendModel.find(filter).sort({ trendDate: -1, createdAt: -1 }).limit(20).exec();
    }
}

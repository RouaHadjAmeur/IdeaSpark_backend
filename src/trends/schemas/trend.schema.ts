import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TrendDocument = Trend & Document;

@Schema({ timestamps: true })
export class Trend {
    @Prop({ required: true })
    topic: string;

    @Prop()
    summary: string;

    @Prop()
    volume: string;

    @Prop()
    source: string;

    @Prop({ default: 'fr' })
    language: string;

    /**
     * Geographic target: any country code or label.
     * e.g. 'TN' (Tunisia), 'GLOBAL', 'MA' (Morocco), 'DZ' (Algeria), 'FR', 'US'…
     */
    @Prop({ default: 'GLOBAL' })
    geo: string;

    /**
     * Content niche / category.
     * e.g. 'tech', 'business', 'politics', 'sports', 'entertainment', 'health', 'general'
     */
    @Prop({ default: 'general' })
    niche: string;

    @Prop()
    trendDate: Date;
}

export const TrendSchema = SchemaFactory.createForClass(Trend);

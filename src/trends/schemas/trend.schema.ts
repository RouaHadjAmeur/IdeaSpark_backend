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

    @Prop({ enum: ['fr', 'en', 'ar'], default: 'fr' })
    language: string;

    @Prop()
    trendDate: Date;
}

export const TrendSchema = SchemaFactory.createForClass(Trend);

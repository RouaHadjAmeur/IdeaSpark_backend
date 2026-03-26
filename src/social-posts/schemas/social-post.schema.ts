import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SocialPostDocument = SocialPost & Document;

@Schema({ timestamps: true })
export class SocialPost {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true })
    content: string;

    @Prop({ enum: ['video', 'slogan'], required: true })
    source: string;

    @Prop({ type: Object })
    sourceData: Record<string, any>;

    @Prop({ type: [String], default: [] })
    hashtags: string[];

    @Prop({ enum: ['draft', 'published'], default: 'draft' })
    status: string;

    @Prop()
    publishedAt: Date;
}

export const SocialPostSchema = SchemaFactory.createForClass(SocialPost);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type YoutubeTrendDocument = YoutubeTrend & Document;

@Schema({ collection: 'youtube trends', timestamps: true })
export class YoutubeTrend {
  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  views: number;

  @Prop({ required: true })
  likes: number;

  @Prop({ required: true })
  comments: number;

  @Prop({ required: true })
  channel: string;

  @Prop({ required: true })
  thumbnail: string;

  @Prop({ required: true, index: true })
  video_url: string;

  @Prop({ required: true })
  published_at: Date;

  @Prop({ required: true })
  duration_seconds: number;

  @Prop({ required: true, enum: ['short', 'long'] })
  format: string;

  @Prop({ required: true })
  engagement_rate: number;

  @Prop({ required: true })
  virality_score: number;
}

export const YoutubeTrendSchema = SchemaFactory.createForClass(YoutubeTrend);


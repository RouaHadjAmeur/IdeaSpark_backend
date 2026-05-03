import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GeneratedCaptionDocument = GeneratedCaption & Document;

@Schema({ timestamps: true })
export class GeneratedCaption {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  postTitle: string;

  @Prop({ required: true })
  platform: string;

  @Prop({ required: true })
  format: string;

  @Prop({ required: true })
  pillar: string;

  @Prop({ required: true })
  ctaType: string;

  @Prop({ required: true })
  language: string;

  @Prop()
  brandName: string;

  @Prop({ type: Object, required: true })
  captions: {
    short: string;
    medium: string;
    long: string;
    hashtags: string[];
    emojis: string[];
    cta: string;
  };

  @Prop({ type: String, default: null })
  imageUrl: string | null;

  @Prop({ default: false })
  isFavorite: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const GeneratedCaptionSchema = SchemaFactory.createForClass(GeneratedCaption);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Video extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  category?: string;

  @Prop({ enum: ['short', 'medium', 'long'], default: 'medium' })
  duration: string;

  @Prop({ enum: ['portrait', 'landscape', 'square'], default: 'landscape' })
  orientation: string;

  @Prop({ required: true })
  videoUrl: string;

  @Prop({ required: true })
  thumbnailUrl: string;

  @Prop({ required: true })
  videoDuration: number;

  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  height: number;

  @Prop()
  author?: string;

  @Prop()
  authorUrl?: string;

  @Prop({ default: 'pexels' })
  source: string;

  @Prop()
  pexelsVideoId?: number;

  @Prop({ default: false })
  usedInPost: boolean;

  @Prop()
  postId?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const VideoSchema = SchemaFactory.createForClass(Video);

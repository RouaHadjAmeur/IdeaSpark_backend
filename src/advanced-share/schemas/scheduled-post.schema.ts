import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum SocialPlatform {
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
}

export enum PostStatus {
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Schema()
export class ShareStatistics {
  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: 0 })
  comments: number;

  @Prop({ default: 0 })
  shares: number;

  @Prop({ default: 0 })
  reach: number;

  @Prop({ default: 0 })
  engagement: number;

  @Prop({ default: 0 })
  clickThroughRate: number;
}

@Schema({ timestamps: true })
export class ScheduledPost extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  contentId: string;

  @Prop({ enum: ['image', 'video'], required: true })
  contentType: string;

  @Prop({ required: true })
  contentUrl: string;

  @Prop({ required: true })
  caption: string;

  @Prop({ type: [String], default: [] })
  hashtags: string[];

  @Prop({ type: [String], enum: Object.values(SocialPlatform), required: true })
  platforms: SocialPlatform[];

  @Prop({ type: [String], required: true })
  accountIds: string[];

  @Prop({ required: true })
  scheduledTime: Date;

  @Prop({ enum: PostStatus, default: PostStatus.SCHEDULED })
  status: PostStatus;

  @Prop()
  publishedAt?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ type: ShareStatistics })
  statistics?: ShareStatistics;

  @Prop({ type: [String], default: [] })
  publishedPostIds: string[]; // IDs des posts sur chaque plateforme

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ScheduledPostSchema = SchemaFactory.createForClass(ScheduledPost);
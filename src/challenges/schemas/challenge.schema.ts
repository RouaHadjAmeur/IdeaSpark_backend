import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ChallengeStatus {
  DRAFT = 'draft',
  LIVE = 'live',
  REVIEW = 'review',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Challenge extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  brief: string;

  @Prop()
  rules: string;

  @Prop({ enum: ['UGC', 'Testimonial', 'Product Demo', 'Unboxing', 'Other'], default: 'UGC' })
  videoType: string;

  @Prop()
  reward: number;

  @Prop()
  runnerUpReward: number;

  @Prop()
  language: string;

  @Prop()
  targetAudience: string;

  @Prop({ enum: Object.values(ChallengeStatus), default: ChallengeStatus.DRAFT })
  status: ChallengeStatus;

  @Prop({ type: [String], default: [] })
  criteria: string[];

  @Prop()
  deadline: Date;

  @Prop({ default: 0 })
  submissionCap: number;

  @Prop({ default: 0 })
  submissionCount: number;

  @Prop({ default: 0 })
  shortlistedCount: number;

  @Prop({ type: Types.ObjectId, ref: 'Submission' })
  winnerSubmissionId: Types.ObjectId;

  @Prop({ default: 15 })
  minDuration: number; // in seconds

  @Prop({ default: 60 })
  maxDuration: number; // in seconds

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);

// Fast challenge browsing
ChallengeSchema.index({ status: 1, deadline: 1 });
ChallengeSchema.index({ brandId: 1, status: 1 });

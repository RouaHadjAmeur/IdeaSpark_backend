import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanHistoryDocument = PlanHistory & Document;

@Schema({ timestamps: true })
export class PlanHistory {
  @Prop({ required: true }) planId: string;
  @Prop() authorId: string;
  @Prop({ required: true }) authorName: string;
  @Prop({ required: true }) action: string;
  @Prop({ required: true }) description: string;
  createdAt: Date;
}

export const PlanHistorySchema = SchemaFactory.createForClass(PlanHistory);
PlanHistorySchema.index({ planId: 1 });

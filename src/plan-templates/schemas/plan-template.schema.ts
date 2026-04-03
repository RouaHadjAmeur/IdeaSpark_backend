import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanTemplateDocument = PlanTemplate & Document;

@Schema({ timestamps: true })
export class PlanTemplate {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) name: string;
  @Prop() description: string;
  @Prop() durationWeeks: number;
  @Prop() postingFrequency: number;
  @Prop() totalPosts: number;
  @Prop() planId: string;
  createdAt: Date;
}

export const PlanTemplateSchema = SchemaFactory.createForClass(PlanTemplate);
PlanTemplateSchema.index({ userId: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScheduledNotificationDocument = ScheduledNotification & Document;

@Schema({ timestamps: true })
export class ScheduledNotification {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) planId: string;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) body: string;
  @Prop({ required: true }) scheduledAt: Date;
  @Prop({ default: false }) sent: boolean;
  createdAt: Date;
}

export const ScheduledNotificationSchema = SchemaFactory.createForClass(ScheduledNotification);
ScheduledNotificationSchema.index({ userId: 1 });
ScheduledNotificationSchema.index({ scheduledAt: 1, sent: 1 });

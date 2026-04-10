import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FcmTokenDocument = FcmToken & Document;

@Schema({ timestamps: true })
export class FcmToken {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) fcmToken: string;
  @Prop({ enum: ['android', 'ios'], default: 'android' }) platform: string;
  createdAt: Date;
}

export const FcmTokenSchema = SchemaFactory.createForClass(FcmToken);
FcmTokenSchema.index({ userId: 1 });
FcmTokenSchema.index({ fcmToken: 1 }, { unique: true });

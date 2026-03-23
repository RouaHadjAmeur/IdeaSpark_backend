import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GoogleTokenDocument = GoogleToken & Document;

@Schema({ timestamps: true })
export class GoogleToken {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop()
  refreshToken: string;

  @Prop()
  expiryDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const GoogleTokenSchema = SchemaFactory.createForClass(GoogleToken);

GoogleTokenSchema.index({ userId: 1 });

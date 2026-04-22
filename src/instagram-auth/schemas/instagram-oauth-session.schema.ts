import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InstagramOauthSessionDocument = HydratedDocument<InstagramOauthSession>;

@Schema({ timestamps: true })
export class InstagramOauthSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  state: string;

  @Prop()
  appRedirectUri?: string;

  @Prop({ required: true, expires: 0 })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;
}

export const InstagramOauthSessionSchema = SchemaFactory.createForClass(InstagramOauthSession);


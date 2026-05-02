import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type YoutubeOauthSessionDocument = HydratedDocument<YoutubeOauthSession>;

@Schema({ timestamps: true })
export class YoutubeOauthSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  state: string;

  @Prop({ required: true })
  codeVerifier: string;

  @Prop()
  appRedirectUri?: string;

  @Prop({ required: true, expires: 0 })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;
}

export const YoutubeOauthSessionSchema = SchemaFactory.createForClass(YoutubeOauthSession);


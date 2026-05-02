import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type YoutubeAccountDocument = HydratedDocument<YoutubeAccount>;

@Schema({ timestamps: true })
export class YoutubeAccount {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  platform: 'youtube';

  @Prop({ required: true })
  accessToken: string;

  @Prop()
  refreshToken?: string;

  @Prop({ type: [String], default: [] })
  scope: string[];

  @Prop()
  expiryDate?: Date;

  @Prop()
  channelId?: string;

  @Prop()
  channelTitle?: string;

  @Prop()
  channelThumbnail?: string;
}

export const YoutubeAccountSchema = SchemaFactory.createForClass(YoutubeAccount);


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InstagramAccountDocument = HydratedDocument<InstagramAccount>;

@Schema({ timestamps: true })
export class InstagramAccount {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  platform: 'instagram';

  @Prop({ required: true })
  accessToken: string;

  @Prop({ type: [String], default: [] })
  scope: string[];

  @Prop()
  expiryDate?: Date;

  @Prop()
  igUserId?: string;

  @Prop()
  username?: string;

  @Prop()
  profilePictureUrl?: string;

  @Prop()
  pageId?: string;

  @Prop()
  pageName?: string;

  @Prop({ type: Object })
  latestInsights?: {
    views: number;
    interactions: number;
    newFollowers: number;
    contentShared: number;
    updatedAt: Date;
  };
}

export const InstagramAccountSchema = SchemaFactory.createForClass(InstagramAccount);


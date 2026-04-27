import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SocialPlatform } from './scheduled-post.schema';

@Schema({ timestamps: true })
export class SocialAccount extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ enum: SocialPlatform, required: true })
  platform: SocialPlatform;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  username: string;

  @Prop()
  profileImageUrl?: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop()
  refreshToken?: string;

  @Prop()
  tokenExpiresAt?: Date;

  @Prop()
  platformUserId?: string; // ID de l'utilisateur sur la plateforme

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  connectedAt: Date;

  @Prop({ default: Date.now })
  lastUsedAt: Date;

  @Prop({ type: Object })
  platformData?: any; // Données spécifiques à la plateforme
}

export const SocialAccountSchema = SchemaFactory.createForClass(SocialAccount);
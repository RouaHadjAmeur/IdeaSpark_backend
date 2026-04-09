import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FriendshipDocument = Friendship & Document;

@Schema({ timestamps: true })
export class Friendship {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user1: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user2: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Invitation' })
  invitation: Types.ObjectId;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

// Index unique pour éviter les doublons d'amitié entre deux utilisateurs
FriendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

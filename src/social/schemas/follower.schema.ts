import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FollowStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
}

export type FollowerDocument = Follower & Document;

@Schema({ timestamps: true })
export class Follower {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    followerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    followingId: Types.ObjectId;

    @Prop({ type: String, enum: FollowStatus, default: FollowStatus.PENDING })
    status: FollowStatus;
}

export const FollowerSchema = SchemaFactory.createForClass(Follower);

// Ensure a user can only follow another user once
FollowerSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowerSchema.index({ followerId: 1 });
FollowerSchema.index({ followingId: 1 });

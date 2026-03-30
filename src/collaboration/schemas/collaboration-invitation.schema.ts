import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollaborationInvitationDocument = CollaborationInvitation & Document;

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
    REMOVED = 'removed',
}

@Schema({ timestamps: true })
export class CollaborationInvitation {
    @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    inviterId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    inviteeId: Types.ObjectId;

    @Prop({ required: true, default: 'collaborator' })
    role: string;

    @Prop({ type: String, enum: Object.values(InvitationStatus), default: InvitationStatus.PENDING })
    status: InvitationStatus;
}

export const CollaborationInvitationSchema = SchemaFactory.createForClass(CollaborationInvitation);

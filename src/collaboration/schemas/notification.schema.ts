import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId; // User who receives notification

    @Prop({ required: true })
    type: string; // 'invite_received', 'invite_accepted', 'invite_declined', 'collaborator_removed', 'project_updated'

    @Prop({ required: true })
    message: string;

    @Prop({ type: Types.ObjectId, ref: 'Plan' })
    relatedPlanId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    relatedUserId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'CollaborationInvitation' })
    relatedInvitationId?: Types.ObjectId;

    @Prop({ default: false })
    read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

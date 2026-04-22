import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeliverableDocument = Deliverable & Document;

export enum DeliverableStatus {
    SUBMITTED = 'submitted',
    APPROVED = 'approved',
    REVISION = 'revision',
    REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Deliverable {
    @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
    taskId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop()
    fileUrl?: string;

    @Prop()
    textContent?: string;

    @Prop({ default: 1 })
    version: number;

    @Prop({ type: String, enum: Object.values(DeliverableStatus), default: DeliverableStatus.SUBMITTED })
    status: DeliverableStatus;

    @Prop()
    feedback?: string;
}

export const DeliverableSchema = SchemaFactory.createForClass(Deliverable);

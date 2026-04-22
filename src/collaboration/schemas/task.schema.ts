import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    DONE = 'done',
}

@Schema({ timestamps: true })
export class Task {
    @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    assignedTo: Types.ObjectId;

    @Prop({ type: String, enum: Object.values(TaskStatus), default: TaskStatus.TODO })
    status: TaskStatus;

    @Prop()
    deadline: Date;

    @Prop({ type: Types.ObjectId, ref: 'Deliverable' })
    deliverableId?: Types.ObjectId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

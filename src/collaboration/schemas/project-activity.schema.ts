import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectActivityDocument = ProjectActivity & Document;

@Schema({ timestamps: true })
export class ProjectActivity {
    @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    userName: string;

    @Prop({ required: true })
    actionType: string; // 'create', 'update', 'delete', 'invite', 'accept', 'remove'

    @Prop()
    fieldChanged?: string;

    @Prop()
    oldValue?: string;

    @Prop()
    newValue?: string;
}

export const ProjectActivitySchema = SchemaFactory.createForClass(ProjectActivity);

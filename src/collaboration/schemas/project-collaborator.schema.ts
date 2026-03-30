import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectCollaboratorDocument = ProjectCollaborator & Document;

@Schema({ timestamps: true })
export class ProjectCollaborator {
    @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
    planId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, default: 'collaborator' })
    role: string;
}

export const ProjectCollaboratorSchema = SchemaFactory.createForClass(ProjectCollaborator);

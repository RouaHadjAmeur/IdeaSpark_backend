import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlanMemberDocument = PlanMember & Document;

export enum MemberRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum MemberStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class PlanMember {
  @Prop({ required: true }) planId: string;
  @Prop() userId: string;
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) name: string;
  @Prop({ enum: Object.values(MemberRole), default: MemberRole.EDITOR }) role: MemberRole;
  @Prop({ enum: Object.values(MemberStatus), default: MemberStatus.PENDING }) status: MemberStatus;
  @Prop({ unique: true }) inviteToken: string;
  @Prop() acceptedAt: Date;
  createdAt: Date;
}

export const PlanMemberSchema = SchemaFactory.createForClass(PlanMember);
PlanMemberSchema.index({ planId: 1 });

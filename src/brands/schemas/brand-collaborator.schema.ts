import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BrandCollaboratorDocument = BrandCollaborator & Document;

export enum BrandInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Schema({ timestamps: true })
export class BrandCollaborator {
  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId; // the collaborator

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  inviterId: Types.ObjectId; // the brand owner

  @Prop({ required: true, enum: BrandInviteStatus, default: BrandInviteStatus.PENDING })
  status: BrandInviteStatus;
}

export const BrandCollaboratorSchema = SchemaFactory.createForClass(BrandCollaborator);

// Unique: one pending/accepted invite per (brand, user)
BrandCollaboratorSchema.index({ brandId: 1, userId: 1 }, { unique: true });

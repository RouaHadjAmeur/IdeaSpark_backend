import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvitationDocument = Invitation & Document;

@Schema({ timestamps: true })
export class Invitation {
  @Prop({ required: true, default: 'PENDING', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'] })
  status: string;

  @Prop()
  respondedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver: Types.ObjectId;
}

export const InvitationSchema = SchemaFactory.createForClass(Invitation);

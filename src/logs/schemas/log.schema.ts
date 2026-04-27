import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type LogDocument = Log & Document;

@Schema({ timestamps: true })
export class Log {
  @ApiProperty({ description: 'The user who performed the action' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'The action performed', example: 'LOGIN' })
  @Prop({ required: true })
  action: string;

  @ApiProperty({ description: 'Details about the action', example: 'Admin blocked user john.doe@example.com' })
  @Prop()
  details: string;

  @ApiProperty({ description: 'IP address of the user' })
  @Prop()
  ip?: string;

  @ApiProperty({ description: 'Target user ID (if applicable)' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  targetUserId?: Types.ObjectId;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt?: Date;
}

export const LogSchema = SchemaFactory.createForClass(Log);

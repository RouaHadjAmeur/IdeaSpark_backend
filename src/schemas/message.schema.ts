import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true }) 
export class Message {
  
  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;        

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver: Types.ObjectId;        

  @Prop({ default: false })
  isRead: boolean;               

  @Prop({ default: false })
  isDeleted: boolean;           

  @Prop({ type: String, default: 'text', enum: ['text', 'image', 'file'] })
  messageType: string;         

  @Prop({ type: String, default: null })
  attachmentUrl: string;        
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// ✅ Index pour accélérer les requêtes
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

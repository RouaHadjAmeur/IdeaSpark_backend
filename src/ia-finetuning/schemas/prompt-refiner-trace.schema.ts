import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PromptRefinerTraceDocument = PromptRefinerTrace & Document;

@Schema({ timestamps: true })
export class PromptRefinerTrace {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  inputPrompt: string;

  @Prop({ required: true })
  refinedResult: string;

  @Prop({ required: true })
  modelLoaded: boolean;

  @Prop({ required: true })
  status: string; // 'success' or 'error'
}

export const PromptRefinerTraceSchema = SchemaFactory.createForClass(PromptRefinerTrace);

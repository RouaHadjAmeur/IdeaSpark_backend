import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductIdeaTraceDocument = ProductIdeaTrace & Document;

@Schema({ timestamps: true })
export class ProductIdeaTrace {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  besoin: string;

  @Prop({ type: Object, required: true })
  produit: any;

  @Prop({ required: true })
  rawOutput: string;

  @Prop({ required: true })
  durationSeconds: number;

  @Prop({ required: true })
  modelLoaded: boolean;

  @Prop({ required: true })
  status: string; // 'success' or 'error'
}

export const ProductIdeaTraceSchema = SchemaFactory.createForClass(ProductIdeaTrace);

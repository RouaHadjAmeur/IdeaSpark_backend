import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductIdeaDocument = ProductIdea & Document;

@Schema({ timestamps: true })
export class ProductIdea {
  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  detailedDescription: string;

  @Prop({ required: true })
  painPoint: string;

  @Prop({ required: true })
  solution: string;

  @Prop({ type: [Object], required: true })
  features: Array<{
    name: string;
    description: string;
    priority: string;
  }>;

  @Prop({ type: Object, required: true })
  marketAnalysis: {
    marketScore: number;
    marketSize: string;
    competitionLevel: string;
    marketTrend: string;
    competitors: string[];
  };

  @Prop({ type: Object, required: true })
  pricing: {
    minPrice: number;
    optimalPrice: number;
    maxPrice: number;
    priceJustification: string;
  };

  @Prop({ required: true })
  targetAudience: string;

  @Prop({ required: true })
  uniqueValueProposition: string;

  @Prop({ type: [String], required: true })
  nextSteps: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: false })
  isFavorite: boolean;
}

export const ProductIdeaSchema = SchemaFactory.createForClass(ProductIdea);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductIdeaDocument = ProductIdea & Document;

@Schema()
export class ProductSection {
  @Prop({ required: true })
  nomDuProduit: string;

  @Prop({ required: true })
  probleme: string;

  @Prop({ required: true })
  solution: string;

  @Prop({ required: true })
  cible: string;

  @Prop({ required: true })
  modeleEconomique: string;

  @Prop({ required: true })
  mvp: string;
}

export const ProductSectionSchema = SchemaFactory.createForClass(ProductSection);

@Schema({ timestamps: true })
export class ProductIdea {
  @Prop({ required: true })
  besoin: string;

  @Prop({ type: ProductSectionSchema, required: true })
  produit: ProductSection;

  @Prop({ required: true })
  rawOutput: string;

  @Prop({ required: true, type: Number })
  durationSeconds: number;

  @Prop({ required: true, type: Boolean })
  modelLoaded: boolean;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: false })
  isFavorite: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ProductIdeaSchema = SchemaFactory.createForClass(ProductIdea);

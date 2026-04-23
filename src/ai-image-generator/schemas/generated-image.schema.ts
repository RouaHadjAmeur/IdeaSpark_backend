import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GeneratedImageDocument = GeneratedImage & Document;

@Schema({ timestamps: true })
export class GeneratedImage {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) url: string;
  @Prop({ required: true }) prompt: string;
  @Prop({ required: true }) style: string;
  @Prop() brandName?: string;
  @Prop() category?: string; // 🆕 AMÉLIORATION 3: Tracker la catégorie
  @Prop() specificObject?: string; // 🆕 AMÉLIORATION 3: Tracker l'objet spécifique
  createdAt: Date;
  updatedAt: Date;
}

export const GeneratedImageSchema = SchemaFactory.createForClass(GeneratedImage);
GeneratedImageSchema.index({ userId: 1 });
GeneratedImageSchema.index({ category: 1 }); // 🆕 Index pour statistiques
GeneratedImageSchema.index({ specificObject: 1 }); // 🆕 Index pour statistiques

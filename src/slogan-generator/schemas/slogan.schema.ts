import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SloganDocument = Slogan & Document;

@Schema({ timestamps: true })
export class Slogan {
  @Prop({ required: true })
  slogan: string;

  @Prop({ required: true })
  explanation: string;

  @Prop({ required: true })
  memorabilityScore: number;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: false })
  isFavorite: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const SloganSchema = SchemaFactory.createForClass(Slogan);

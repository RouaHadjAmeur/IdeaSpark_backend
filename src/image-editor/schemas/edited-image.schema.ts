import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ImageFilter {
  NONE = 'none',
  BLACK_AND_WHITE = 'blackAndWhite',
  SEPIA = 'sepia',
  VINTAGE = 'vintage',
  COOL = 'cool',
  WARM = 'warm',
  BRIGHT = 'bright',
  DARK = 'dark',
}

export enum ImageFrame {
  NONE = 'none',
  SIMPLE = 'simple',
  ROUNDED = 'rounded',
  SHADOW = 'shadow',
  POLAROID = 'polaroid',
  FILM = 'film',
}

export enum ImageEffect {
  NONE = 'none',
  BLUR = 'blur',
  SHADOW = 'shadow',
  GLOW = 'glow',
  EMBOSS = 'emboss',
  SHARPEN = 'sharpen',
}

@Schema()
export class TextOverlay {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true, min: 0, max: 1 })
  x: number;

  @Prop({ required: true, min: 0, max: 1 })
  y: number;

  @Prop({ required: true, min: 8, max: 200 })
  fontSize: number;

  @Prop({ required: true })
  color: number;

  @Prop({ default: false })
  bold: boolean;

  @Prop({ default: false })
  italic: boolean;
}

@Schema({ timestamps: true })
export class EditedImage extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  originalUrl: string;

  @Prop()
  editedUrl?: string;

  @Prop({ enum: ImageFilter, default: ImageFilter.NONE })
  filter: ImageFilter;

  @Prop({ enum: ImageFrame, default: ImageFrame.NONE })
  frame: ImageFrame;

  @Prop()
  frameColor?: number;

  @Prop({ type: [TextOverlay], default: [] })
  textOverlays: TextOverlay[];

  @Prop({ type: [String], enum: ImageEffect, default: [] })
  effects: ImageEffect[];

  @Prop()
  resizedWidth?: number;

  @Prop()
  resizedHeight?: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EditedImageSchema = SchemaFactory.createForClass(EditedImage);
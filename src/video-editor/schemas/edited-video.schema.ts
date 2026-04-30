import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum VideoTransitionType {
  FADE = 'fade',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  DISSOLVE = 'dissolve',
  WIPE = 'wipe',
}

@Schema()
export class VideoMusic {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  path: string;

  @Prop({ min: 0, max: 1, default: 0.5 })
  volume: number;
}

@Schema()
export class VideoTextOverlay {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true, min: 0 })
  startTime: number; // en secondes

  @Prop({ required: true, min: 0 })
  endTime: number; // en secondes

  @Prop({ required: true, min: 0, max: 1 })
  x: number; // Position 0-1

  @Prop({ required: true, min: 0, max: 1 })
  y: number; // Position 0-1

  @Prop({ required: true, min: 8, max: 200 })
  fontSize: number;

  @Prop({ required: true })
  color: number;

  @Prop({ default: false })
  bold: boolean;

  @Prop({ default: false })
  italic: boolean;
}

@Schema()
export class VideoSubtitle {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true, min: 0 })
  startTime: number; // en secondes

  @Prop({ required: true, min: 0 })
  endTime: number; // en secondes

  @Prop({ default: 24 })
  fontSize: number;

  @Prop({ default: 0xFFFFFF })
  color: number;
}

@Schema()
export class VideoTransition {
  @Prop({ enum: VideoTransitionType, required: true })
  type: VideoTransitionType;

  @Prop({ required: true, min: 0.1, max: 5 })
  duration: number; // en secondes

  @Prop({ required: true, min: 0 })
  position: number; // position dans la vidéo en secondes
}

@Schema({ timestamps: true })
export class EditedVideo extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  originalVideoPath: string;

  @Prop()
  editedVideoPath?: string;

  @Prop({ type: VideoMusic })
  music?: VideoMusic;

  @Prop({ type: [VideoTextOverlay], default: [] })
  textOverlays: VideoTextOverlay[];

  @Prop({ type: [VideoSubtitle], default: [] })
  subtitles: VideoSubtitle[];

  @Prop({ min: 0 })
  trimStart?: number; // en secondes

  @Prop({ min: 0 })
  trimEnd?: number; // en secondes

  @Prop({ type: [VideoTransition], default: [] })
  transitions: VideoTransition[];

  @Prop({ min: 0 })
  originalDuration?: number; // durée originale en secondes

  @Prop({ min: 0 })
  editedDuration?: number; // durée après édition en secondes

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const EditedVideoSchema = SchemaFactory.createForClass(EditedVideo);
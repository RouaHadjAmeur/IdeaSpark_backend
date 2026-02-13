import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VideoIdeaDocument = VideoIdea & Document;

export enum ShotType {
  ARoll = 'aRoll',
  BRoll = 'bRoll',
  ProductCloseUp = 'productCloseUp',
  Testimonial = 'testimonial',
  ScreenText = 'screenText',
}

@Schema()
export class VideoScene {
  @Prop({ required: true })
  startSec: number;

  @Prop({ required: true })
  endSec: number;

  @Prop({ required: true, enum: ShotType })
  shotType: ShotType;

  @Prop()
  description: string;

  @Prop()
  onScreenText: string;

  @Prop()
  voiceOver: string;
}

export const VideoSceneSchema = SchemaFactory.createForClass(VideoScene);


@Schema({ timestamps: true })
export class VideoVersion {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  hook: string;

  @Prop({ required: true })
  script: string;

  @Prop({ type: [VideoSceneSchema], default: [] })
  scenes: VideoScene[];

  @Prop({ required: true })
  cta: string;

  @Prop({ required: true })
  caption: string;

  @Prop([String])
  hashtags: string[];

  @Prop()
  thumbnailText: string;

  @Prop()
  filmingNotes: string;

  @Prop()
  complianceNote: string;

  @Prop({ type: [String], default: [] })
  suggestedLocations: string[];

  @Prop({
    type: [{
      location: { type: String },
      hook: { type: String },
    }],
    default: [],
  })
  locationHooks: { location: string; hook: string }[];

  @Prop()
  refinementInstruction?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const VideoVersionSchema = SchemaFactory.createForClass(VideoVersion);

@Schema({ timestamps: true })
export class VideoIdea {
  @Prop({ type: [VideoVersionSchema], default: [] })
  versions: VideoVersion[];

  @Prop({ default: 0 })
  currentVersionIndex: number;

  @Prop()
  productImageUrl?: string;

  @Prop()
  userId?: string;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ default: false })
  isFavorite: boolean;
}

export const VideoIdeaSchema = SchemaFactory.createForClass(VideoIdea);

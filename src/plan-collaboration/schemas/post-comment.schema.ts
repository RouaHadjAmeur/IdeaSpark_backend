import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostCommentDocument = PostComment & Document;

export enum CommentAction {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMMENTED = 'commented',
}

@Schema({ timestamps: true })
export class PostComment {
  @Prop({ required: true }) postId: string;
  @Prop({ required: true }) planId: string;
  @Prop() authorId: string;
  @Prop({ required: true }) authorName: string;
  @Prop({ required: true }) text: string;
  @Prop({ enum: Object.values(CommentAction), default: CommentAction.COMMENTED }) action: CommentAction;
  createdAt: Date;
}

export const PostCommentSchema = SchemaFactory.createForClass(PostComment);
PostCommentSchema.index({ postId: 1 });
PostCommentSchema.index({ planId: 1 });

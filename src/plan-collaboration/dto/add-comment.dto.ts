import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommentAction } from '../schemas/post-comment.schema';

export class AddCommentDto {
  @ApiProperty() @IsString() @IsNotEmpty() postId: string;
  @ApiProperty() @IsString() @IsNotEmpty() planId: string;
  @ApiProperty() @IsString() @IsNotEmpty() text: string;
  @ApiProperty({ enum: CommentAction, default: CommentAction.COMMENTED })
  @IsEnum(CommentAction) @IsOptional() action: CommentAction = CommentAction.COMMENTED;
}

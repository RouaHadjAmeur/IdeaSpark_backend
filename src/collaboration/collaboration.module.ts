import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';
import { PlanMember, PlanMemberSchema } from './schemas/plan-member.schema';
import { PostComment, PostCommentSchema } from './schemas/post-comment.schema';
import { PlanHistory, PlanHistorySchema } from './schemas/plan-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlanMember.name, schema: PlanMemberSchema },
      { name: PostComment.name, schema: PostCommentSchema },
      { name: PlanHistory.name, schema: PlanHistorySchema },
    ]),
  ],
  controllers: [CollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}

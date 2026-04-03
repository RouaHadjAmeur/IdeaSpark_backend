import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanCollaborationController } from './plan-collaboration.controller';
import { PlanCollaborationService } from './plan-collaboration.service';
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
  controllers: [PlanCollaborationController],
  providers: [PlanCollaborationService],
  exports: [PlanCollaborationService],
})
export class PlanCollaborationModule {}

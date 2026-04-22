import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ChallengesService } from './challenges.service';
import { SubmissionsService } from './submissions.service';
import { BrandCollaboratorSubmitGuard } from './guards/brand-collaborator-submit.guard';
import { ChallengesController } from './challenges.controller';
import { SubmissionsController } from './submissions.controller';
import { Challenge, ChallengeSchema } from './schemas/challenge.schema';
import { Submission, SubmissionSchema } from './schemas/submission.schema';
import { ShortlistedCreator, ShortlistedCreatorSchema } from './schemas/shortlisted-creator.schema';
import { Brand, BrandSchema } from '../brands/schemas/brand.schema';
import { BrandCollaborator, BrandCollaboratorSchema } from '../brands/schemas/brand-collaborator.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { PlansModule } from '../plans/plans.module';
import { ProjectCollaborator, ProjectCollaboratorSchema } from '../collaboration/schemas/project-collaborator.schema';
import { Plan, PlanSchema } from '../plans/schemas/plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Challenge.name, schema: ChallengeSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: ShortlistedCreator.name, schema: ShortlistedCreatorSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: ProjectCollaborator.name, schema: ProjectCollaboratorSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: BrandCollaborator.name, schema: BrandCollaboratorSchema },
    ]),
    NotificationsModule,
    CollaborationModule,
    PlansModule,
    ConfigModule,
  ],
  controllers: [ChallengesController, SubmissionsController],
  providers: [ChallengesService, SubmissionsService, BrandCollaboratorSubmitGuard],
  exports: [ChallengesService, SubmissionsService],
})
export class ChallengesModule {}

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';
import { CollaborationInvitation, CollaborationInvitationSchema } from './schemas/collaboration-invitation.schema';
import { ProjectCollaborator, ProjectCollaboratorSchema } from './schemas/project-collaborator.schema';
import { ProjectActivity, ProjectActivitySchema } from './schemas/project-activity.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { PlansModule } from '../plans/plans.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CollaborationInvitation.name, schema: CollaborationInvitationSchema },
      { name: ProjectCollaborator.name, schema: ProjectCollaboratorSchema },
      { name: ProjectActivity.name, schema: ProjectActivitySchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    forwardRef(() => PlansModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [CollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}

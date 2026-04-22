import { Global, Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';
import { CollaborationInvitation, CollaborationInvitationSchema } from './schemas/collaboration-invitation.schema';
import { ProjectCollaborator, ProjectCollaboratorSchema } from './schemas/project-collaborator.schema';
import { ProjectActivity, ProjectActivitySchema } from './schemas/project-activity.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { PlansModule } from '../plans/plans.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { CollaborationGateway } from './gateways/collaboration.gateway';
import { Task, TaskSchema } from './schemas/task.schema';
import { Deliverable, DeliverableSchema } from './schemas/deliverable.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CollaborationInvitation.name, schema: CollaborationInvitationSchema },
      { name: ProjectCollaborator.name, schema: ProjectCollaboratorSchema },
      { name: ProjectActivity.name, schema: ProjectActivitySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Deliverable.name, schema: DeliverableSchema },
    ]),
    forwardRef(() => PlansModule),
    forwardRef(() => UsersModule),
    AuthModule,
  ],
  controllers: [CollaborationController],
  providers: [CollaborationService, CollaborationGateway],
  exports: [CollaborationService, CollaborationGateway],
})
export class CollaborationModule {}

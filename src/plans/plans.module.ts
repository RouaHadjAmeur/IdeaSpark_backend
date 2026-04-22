import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PlanGeneratorService } from './ai/plan-generator.service';
import { DashboardAlertsService } from './ai/dashboard-alerts.service';

import { Plan, PlanSchema } from './schemas/plan.schema';
import { CalendarEntry, CalendarEntrySchema } from './schemas/calendar-entry.schema';

import { BrandsModule } from '../brands/brands.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { UsersModule } from '../users/users.module';
import { AIProjectService } from './ai/ai-project.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Task, TaskSchema } from '../collaboration/schemas/task.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Plan.name,          schema: PlanSchema },
            { name: CalendarEntry.name, schema: CalendarEntrySchema },
            { name: User.name,          schema: UserSchema },
            { name: Task.name,          schema: TaskSchema },
        ]),
        BrandsModule, 
        UsersModule,
        forwardRef(() => CollaborationModule),
    ],
    controllers: [PlansController],
    providers: [PlansService, PlanGeneratorService, DashboardAlertsService, AIProjectService],
    exports: [PlansService, MongooseModule],
})
export class PlansModule {}

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

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Plan.name,          schema: PlanSchema },
            { name: CalendarEntry.name, schema: CalendarEntrySchema },
        ]),
        BrandsModule, // provides @InjectModel(Brand.name) without re-registering
        forwardRef(() => CollaborationModule),
    ],
    controllers: [PlansController],
    providers: [PlansService, PlanGeneratorService, DashboardAlertsService],
    exports: [PlansService, MongooseModule],
})
export class PlansModule {}

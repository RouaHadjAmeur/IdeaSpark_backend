import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanTemplatesController } from './plan-templates.controller';
import { PlanTemplatesService } from './plan-templates.service';
import { PlanTemplate, PlanTemplateSchema } from './schemas/plan-template.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: PlanTemplate.name, schema: PlanTemplateSchema }])],
  controllers: [PlanTemplatesController],
  providers: [PlanTemplatesService],
})
export class PlanTemplatesModule {}

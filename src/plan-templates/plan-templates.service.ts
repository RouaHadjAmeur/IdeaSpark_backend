import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlanTemplate, PlanTemplateDocument } from './schemas/plan-template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class PlanTemplatesService {
  constructor(@InjectModel(PlanTemplate.name) private model: Model<PlanTemplateDocument>) {}

  async create(userId: string, dto: CreateTemplateDto) {
    return this.model.create({ ...dto, userId });
  }

  async findAll(userId: string) {
    return this.model.find({ userId }).sort({ createdAt: -1 });
  }

  async delete(id: string, userId: string) {
    const result = await this.model.findOneAndDelete({ _id: id, userId });
    if (!result) throw new NotFoundException('Template introuvable');
    return { success: true };
  }
}

import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Challenge } from '../schemas/challenge.schema';
import { BrandCollaborator } from '../../brands/schemas/brand-collaborator.schema';
import { ProjectCollaborator } from '../../collaboration/schemas/project-collaborator.schema';
import { Plan } from '../../plans/schemas/plan.schema';

@Injectable()
export class BrandCollaboratorSubmitGuard implements CanActivate {
  constructor(
    @InjectModel(Challenge.name) private challengeModel: Model<Challenge>,
    @InjectModel(BrandCollaborator.name) private brandCollabModel: Model<BrandCollaborator>,
    @InjectModel(ProjectCollaborator.name) private projectCollabModel: Model<ProjectCollaborator>,
    @InjectModel(Plan.name) private planModel: Model<Plan>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const challengeId = request.params.challengeId || request.params.id;

    if (!challengeId) throw new BadRequestException('Challenge ID is required');

    const challenge = await this.challengeModel.findById(challengeId).lean().exec();
    if (!challenge) throw new NotFoundException('Challenge not found');

    const brandId = challenge.brandId;
    if (!brandId) throw new ForbiddenException('Challenge has no associated brand');

    const userId = new Types.ObjectId(user.id);
    const brandObjectId = new Types.ObjectId(brandId.toString());

    // Path 1: direct brand collaborator
    const directCollab = await this.brandCollabModel.findOne({
      brandId: brandObjectId,
      userId,
      status: 'accepted',
    }).lean().exec();

    if (directCollab) return true;

    // Path 2: plan-based collaborator (via a plan linked to this brand)
    const plans = await this.planModel.find({ brandId: brandId.toString() }).select('_id').lean().exec();
    if (plans.length > 0) {
      const planIds = plans.map(p => p._id);
      const planCollab = await this.projectCollabModel.findOne({
        planId: { $in: planIds },
        userId,
      }).lean().exec();
      if (planCollab) return true;
    }

    throw new ForbiddenException('You must be a collaborator of this brand to submit');
  }
}

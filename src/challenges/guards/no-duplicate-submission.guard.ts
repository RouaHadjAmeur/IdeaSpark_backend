import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Submission } from '../schemas/submission.schema';

@Injectable()
export class NoDuplicateSubmissionGuard implements CanActivate {
  constructor(@InjectModel(Submission.name) private submissionModel: Model<Submission>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?._id;
    const challengeId = request.body?.challengeId || request.params.challengeId || request.params.id;

    if (!userId || !challengeId) {
      throw new BadRequestException('Missing user or challenge ID');
    }

    const existingSubmission = await this.submissionModel.findOne({
      challengeId,
      creatorId: userId,
    }).exec();

    if (existingSubmission) {
      throw new BadRequestException('You have already submitted to this challenge');
    }

    return true;
  }
}

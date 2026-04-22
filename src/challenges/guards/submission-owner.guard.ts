import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Submission } from '../schemas/submission.schema';

@Injectable()
export class SubmissionOwnerGuard implements CanActivate {
  constructor(@InjectModel(Submission.name) private submissionModel: Model<Submission>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const submissionId = request.params.submissionId;

    if (!userId || !submissionId) {
      throw new ForbiddenException('Missing user or submission ID');
    }

    const submission = await this.submissionModel.findById(submissionId).exec();

    if (!submission) {
      throw new ForbiddenException('Submission not found');
    }

    if (submission.creatorId.toString() !== userId) {
      throw new ForbiddenException('You do not own this submission');
    }

    return true;
  }
}

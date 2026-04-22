import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Challenge, ChallengeStatus } from '../schemas/challenge.schema';

@Injectable()
export class OpenChallengeGuard implements CanActivate {
  constructor(@InjectModel(Challenge.name) private challengeModel: Model<Challenge>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const challengeId = request.body?.challengeId || request.params.challengeId || request.params.id;

    if (!challengeId) {
      throw new BadRequestException('Challenge ID is required');
    }

    const challenge = await this.challengeModel.findById(challengeId).exec();

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.status !== ChallengeStatus.LIVE) {
      throw new BadRequestException('This challenge is not currently accepting submissions');
    }

    if (challenge.deadline && new Date() > challenge.deadline) {
      throw new BadRequestException('The deadline for this challenge has passed');
    }

    if (challenge.submissionCap > 0 && challenge.submissionCount >= challenge.submissionCap) {
      throw new ConflictException('This challenge has reached its submission limit');
    }

    return true;
  }
}

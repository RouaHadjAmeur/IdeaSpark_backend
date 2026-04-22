import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Challenge } from '../schemas/challenge.schema';
import { Brand } from '../../brands/schemas/brand.schema';

@Injectable()
export class ChallengeOwnerGuard implements CanActivate {
  constructor(
    @InjectModel(Challenge.name) private challengeModel: Model<Challenge>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?._id;
    const challengeId = request.params.challengeId || request.params.id;

    if (!userId || !challengeId) {
      throw new ForbiddenException('Missing user or challenge ID');
    }

    const challenge = await this.challengeModel.findById(challengeId).exec();
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const brand = await this.brandModel.findById(challenge.brandId).exec();
    if (!brand) {
      throw new NotFoundException('Associated brand not found');
    }

    if (brand.userId.toString() !== userId.toString()) {
      throw new ForbiddenException('You do not own the brand associated with this challenge');
    }

    return true;
  }
}

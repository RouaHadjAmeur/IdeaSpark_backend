import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateChallengeDto, UpdateChallengeDto } from './dto';
import { Challenge, ChallengeStatus } from './schemas/challenge.schema';
import { Submission, SubmissionStatus } from './schemas/submission.schema';
import { ShortlistedCreator } from './schemas/shortlisted-creator.schema';
import { ProjectCollaborator } from '../collaboration/schemas/project-collaborator.schema';
import { Plan } from '../plans/schemas/plan.schema';
import { BrandCollaborator } from '../brands/schemas/brand-collaborator.schema';
import { CollaborationGateway } from '../collaboration/gateways/collaboration.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    @InjectModel(Challenge.name) private challengeModel: Model<Challenge>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(ShortlistedCreator.name) private shortlistedModel: Model<ShortlistedCreator>,
    @InjectModel(ProjectCollaborator.name) private collaboratorModel: Model<ProjectCollaborator>,
    @InjectModel(Plan.name) private planModel: Model<Plan>,
    @InjectModel(BrandCollaborator.name) private brandCollabModel: Model<BrandCollaborator>,
    private readonly gateway: CollaborationGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createChallenge(dto: CreateChallengeDto, userId: string) {
    const challenge = await this.challengeModel.create({
      brandId: new Types.ObjectId(dto.brandId),
      title: dto.title,
      description: dto.description,
      brief: dto.brief,
      rules: dto.rules,
      videoType: dto.videoType,
      reward: dto.winnerReward,
      runnerUpReward: dto.runnerUpReward,
      language: dto.language,
      targetAudience: dto.targetAudience,
      status: ChallengeStatus.DRAFT,
      criteria: dto.criteria || [],
      deadline: new Date(dto.deadline),
      submissionCap: dto.submissionCap || 0,
      minDuration: dto.minDuration || 15,
      maxDuration: dto.maxDuration || 60,
    });

    return challenge;
  }

  async publishChallenge(challengeId: string) {
    const challenge = await this.challengeModel.findById(challengeId).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    
    if (challenge.status !== ChallengeStatus.DRAFT) {
      throw new BadRequestException('Only draft challenges can be published');
    }

    challenge.status = ChallengeStatus.LIVE;
    await challenge.save();

    // Emit real-time notification to all collaborators
    this.gateway.server.emit('challenge:new', {
      id: challenge._id,
      title: challenge.title,
      reward: challenge.reward,
    });

    return challenge;
  }

  async setChallengeToReview(challengeId: string) {
    const challenge = await this.challengeModel.findById(challengeId).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');

    challenge.status = ChallengeStatus.REVIEW;
    await challenge.save();

    return challenge;
  }

  async getChallengesByBrand(brandId: string, status?: string, limit = 10, offset = 0) {
    const where: any = { brandId: new Types.ObjectId(brandId) };
    if (status) {
      where.status = status;
    }

    const challenges = await this.challengeModel
      .find(where)
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const results = await Promise.all(challenges.map(async (c) => {
      const recentSubmissions = await this.submissionModel
        .find({ challengeId: c._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('creatorId')
        .exec();

      return {
        ...c.toObject(),
        recentSubmitterIds: recentSubmissions.map(s => s.creatorId),
      };
    }));

    return results;
  }

  async getChallengeDetails(challengeId: string) {
    const challenge = await this.challengeModel.findById(challengeId).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');

    return challenge;
  }

  async discoverChallenges(filters: any, sortBy = 'newest', limit = 10, offset = 0) {
    const where: any = { status: ChallengeStatus.LIVE };

    // Filter by collaborations if collaboratorId is provided
    if (filters.collaboratorId) {
      const uid = new Types.ObjectId(filters.collaboratorId);

      // Path 1: plan-based collaborations (legacy)
      const collaborations = await this.collaboratorModel
        .find({ userId: uid })
        .select('planId')
        .exec();
      const planIds = collaborations.map(c => c.planId);
      const plans = await this.planModel
        .find({ _id: { $in: planIds } })
        .select('brandId')
        .exec();
      const planBrandIds = plans.filter(p => p.brandId).map(p => new Types.ObjectId(p.brandId as any));

      // Path 2: direct brand collaborations
      const directBrandRecords = await this.brandCollabModel
        .find({ userId: uid, status: 'accepted' })
        .select('brandId')
        .exec();
      const directBrandIds = directBrandRecords.map(r => r.brandId);

      // Union of both paths
      const allBrandIds = [...planBrandIds, ...directBrandIds];
      where.brandId = { $in: allBrandIds };
    }

    if (filters.search) {
      where.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.videoType) where.videoType = filters.videoType;
    if (filters.language) where.language = filters.language;
    if (filters.minReward) where.reward = { $gte: filters.minReward };

    let sort: any = { createdAt: -1 };
    if (sortBy === 'reward') sort = { reward: -1 };

    const challenges = await this.challengeModel
      .find(where)
      .skip(offset)
      .limit(limit)
      .sort(sort)
      .exec();

    return challenges;
  }

  async getBrandOwnerStats(brandId: string) {
    const challenges = await this.challengeModel.find({ brandId: new Types.ObjectId(brandId) }).exec();
    const challengeIds = challenges.map(c => c._id);

    const [activeCount, totalEntries, shortlistedCount] = await Promise.all([
      this.challengeModel.countDocuments({ brandId, status: ChallengeStatus.LIVE }),
      this.submissionModel.countDocuments({ challengeId: { $in: challengeIds } }),
      this.submissionModel.countDocuments({ challengeId: { $in: challengeIds }, status: SubmissionStatus.SHORTLISTED }),
    ]);

    return {
      active: activeCount,
      entries: totalEntries,
      shortlisted: shortlistedCount,
    };
  }

  async updateChallenge(challengeId: string, dto: UpdateChallengeDto) {
    const challenge = await this.challengeModel.findById(challengeId).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');

    if (challenge.submissionCount > 0) {
      // Only allow updating status or minor things if submissions exist
      const { status } = dto;
      return this.challengeModel.findByIdAndUpdate(challengeId, { status }, { new: true }).exec();
    }

    return this.challengeModel.findByIdAndUpdate(challengeId, dto, { new: true }).exec();
  }

  async deleteChallenge(challengeId: string) {
    const challenge = await this.challengeModel.findById(challengeId).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');

    if (challenge.submissionCount > 0) {
      throw new BadRequestException('Cannot delete challenge with active submissions');
    }

    return this.challengeModel.findByIdAndDelete(challengeId).exec();
  }
}

import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { CreateSubmissionDto, UpdateSubmissionDto, RequestRevisionDto } from './dto';
import { Challenge, ChallengeStatus } from './schemas/challenge.schema';
import { Submission, SubmissionStatus } from './schemas/submission.schema';
import { ShortlistedCreator } from './schemas/shortlisted-creator.schema';
import { CollaborationGateway } from '../collaboration/gateways/collaboration.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { v2 as cloudinary } from 'cloudinary';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    @InjectModel(Challenge.name) private challengeModel: Model<Challenge>,
    @InjectModel(Submission.name) private submissionModel: Model<Submission>,
    @InjectModel(ShortlistedCreator.name) private shortlistedModel: Model<ShortlistedCreator>,
    @InjectConnection() private readonly connection: Connection,
    private readonly gateway: CollaborationGateway,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
    
    // Attempt to set ffprobe path if available
    try {
        const ffprobe = require('ffprobe-static');
        ffmpeg.setFfprobePath(ffprobe.path);
    } catch (e) {
        this.logger.warn('ffprobe-static not found, duration validation might fail if ffmpeg is not in PATH');
    }
  }

  async createSubmission(file: Express.Multer.File, challengeId: string, creatorId: string) {
    const challenge = await this.challengeModel.findById(challengeId).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');

    // Validation logic (assuming guards handled basic checks, but extra check here)
    if (challenge.status !== ChallengeStatus.LIVE) {
      throw new BadRequestException('Challenge is not accepting submissions');
    }

    // 1. Duration validation using ffprobe
    await this.validateVideoDuration(file.path, challenge.minDuration, challenge.maxDuration);

    // 2. Upload to Cloudinary
    const uploadResult = await this.uploadToCloudinary(file.path, challengeId, creatorId);

    // 3. Create submission in DB
    const submission = await this.submissionModel.create({
      challengeId: new Types.ObjectId(challengeId),
      creatorId: new Types.ObjectId(creatorId),
      videoUrl: uploadResult.secure_url,
      thumbnailUrl: uploadResult.thumbnail_url || uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg"),
      status: SubmissionStatus.PENDING,
    });

    // 4. Update challenge count
    await this.challengeModel.findByIdAndUpdate(challengeId, { $inc: { submissionCount: 1 } });

    // 5. Emit real-time notification to Brand Owner
    const brand = await this.challengeModel.findById(challengeId).populate('brandId').exec();
    const brandOwnerId = (brand?.brandId as any)?.userId;
    if (brandOwnerId) {
      this.gateway.emitNotification(brandOwnerId.toString(), {
        type: 'submission:received',
        challengeId,
        submissionId: submission._id,
        message: `New submission received for ${challenge.title}`,
      });
    }

    // Clean up temp file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    return submission;
  }

  private async validateVideoDuration(path: string, min: number, max: number): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(path, (err, metadata) => {
        if (err) return reject(new BadRequestException('Failed to analyze video'));
        const duration = metadata.format.duration;
        if (duration === undefined) {
          return reject(new BadRequestException('Could not determine video duration'));
        }
        if (duration < min || duration > max) {
          return reject(new BadRequestException(`Video duration must be between ${min} and ${max} seconds. Got ${Math.round(duration)}s.`));
        }
        resolve();
      });
    });
  }

  private async uploadToCloudinary(path: string, challengeId: string, creatorId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        path,
        {
          resource_type: 'video',
          folder: `ideaspark/challenges/${challengeId}/${creatorId}`,
          eager: [{ format: 'jpg', resource_type: 'video', transformation: { width: 480, height: 270, crop: 'pad' } }],
        },
        (error, result) => {
          if (error || !result) return reject(new BadRequestException('Upload to Cloudinary failed'));
          resolve({
              secure_url: result.secure_url,
              thumbnail_url: result.eager?.[0]?.secure_url
          });
        },
      );
    });
  }

  async shortlistSubmission(submissionId: string) {
    const submission = await this.submissionModel.findById(submissionId).exec();
    if (!submission) throw new NotFoundException('Submission not found');

    submission.status = SubmissionStatus.SHORTLISTED;
    await submission.save();

    await this.challengeModel.findByIdAndUpdate(submission.challengeId, { $inc: { shortlistedCount: 1 } });

    // Notify creator
    this.gateway.emitNotification(submission.creatorId.toString(), {
      type: 'submission:shortlisted',
      submissionId,
      message: 'Your entry has been shortlisted!',
    });

    return submission;
  }

  async requestRevision(submissionId: string, dto: RequestRevisionDto) {
    const submission = await this.submissionModel.findById(submissionId).exec();
    if (!submission) throw new NotFoundException('Submission not found');

    submission.status = SubmissionStatus.REVISION_REQUESTED;
    submission.feedback = dto.feedback;
    await submission.save();

    // Notify creator
    this.gateway.emitNotification(submission.creatorId.toString(), {
      type: 'submission:revision',
      submissionId,
      feedback: dto.feedback,
      message: 'The brand owner requested a revision of your video.',
    });

    return submission;
  }

  async uploadRevision(submissionId: string, file: Express.Multer.File) {
    const submission = await this.submissionModel.findById(submissionId).exec();
    if (!submission) throw new NotFoundException('Submission not found');

    if (submission.status !== SubmissionStatus.REVISION_REQUESTED) {
      throw new BadRequestException('No revision requested for this submission');
    }

    // 1. Validate duration
    const challenge = await this.challengeModel.findById(submission.challengeId).exec();
    if (!challenge) throw new NotFoundException('Challenge not found');
    await this.validateVideoDuration(file.path, challenge.minDuration, challenge.maxDuration);

    // 2. Clear feedback and push old to history
    submission.revisionHistory.push({
      videoUrl: submission.videoUrl,
      thumbnailUrl: submission.thumbnailUrl,
      submittedAt: submission.updatedAt,
    });

    // 3. Upload new version
    const uploadResult = await this.uploadToCloudinary(file.path, submission.challengeId.toString(), submission.creatorId.toString());
    
    submission.videoUrl = uploadResult.secure_url;
    submission.thumbnailUrl = uploadResult.thumbnail_url || uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg");
    submission.status = SubmissionStatus.PENDING;
    submission.feedback = '';
    
    await submission.save();

    // Clean up
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    return submission;
  }

  async declareWinner(submissionId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const winnerSubmission = await this.submissionModel.findById(submissionId).session(session).exec();
      if (!winnerSubmission) throw new NotFoundException('Submission not found');

      const challengeId = winnerSubmission.challengeId;

      // 1. Mark winner
      winnerSubmission.status = SubmissionStatus.WINNER;
      await winnerSubmission.save({ session });

      // 2. Mark other shortlisted as runner_ups
      await this.submissionModel.updateMany(
        { challengeId, status: SubmissionStatus.SHORTLISTED, _id: { $ne: submissionId } },
        { $set: { status: SubmissionStatus.RUNNER_UP } },
        { session }
      );

      // 3. Mark others as rejected
      await this.submissionModel.updateMany(
        { challengeId, status: { $in: [SubmissionStatus.PENDING, SubmissionStatus.REVISION_REQUESTED] } },
        { $set: { status: SubmissionStatus.REJECTED } },
        { session }
      );

      // 4. Close challenge
      await this.challengeModel.findByIdAndUpdate(challengeId, { 
        status: ChallengeStatus.CLOSED,
        winnerSubmissionId: submissionId 
      }, { session });

      await session.commitTransaction();

      // Notifications (outside transaction)
      this.gateway.emitNotification(winnerSubmission.creatorId.toString(), {
        type: 'submission:winner',
        message: 'Congratulations! You won the challenge!',
      });

      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async rateSubmission(submissionId: string, rating: number) {
    const submission = await this.submissionModel
      .findByIdAndUpdate(submissionId, { rating }, { new: true })
      .exec();
    if (submission) {
      this.gateway.emitNotification(submission.creatorId.toString(), {
        type: 'submission:rated',
        submissionId,
        rating,
        message: `Your submission received a ${rating}-star rating from the brand owner.`,
      });
    }
    return submission;
  }

  async getSubmissionsByChallenge(challengeId: string) {
    return this.submissionModel
      .find({ challengeId: new Types.ObjectId(challengeId) })
      .sort({ rating: -1, createdAt: -1 })
      .exec();
  }

  async getMySubmissions(creatorId: string) {
    const submissions = await this.submissionModel
      .find({ creatorId: new Types.ObjectId(creatorId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const challengeIds = [...new Set(submissions.map(s => s.challengeId.toString()))];
    const challenges = await this.challengeModel
      .find({ _id: { $in: challengeIds } })
      .select('title reward status')
      .lean()
      .exec();

    const challengeMap = new Map(challenges.map(c => [c._id.toString(), c]));

    return submissions.map(s => ({
      ...s,
      challengeTitle: challengeMap.get(s.challengeId.toString())?.title ?? '',
      challengeReward: challengeMap.get(s.challengeId.toString())?.reward ?? 0,
      challengeStatus: challengeMap.get(s.challengeId.toString())?.status ?? '',
    }));
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmissionsService } from './submissions.service';
import { RequestRevisionDto } from './dto';
import { CollaboratorGuard } from './guards/collaborator.guard';
import { BrandCollaboratorSubmitGuard } from './guards/brand-collaborator-submit.guard';
import { OpenChallengeGuard } from './guards/open-challenge.guard';
import { NoDuplicateSubmissionGuard } from './guards/no-duplicate-submission.guard';
import { ChallengeOwnerGuard } from './guards/challenge-owner.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

const uploadOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const dir = './uploads/temp';
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB as requested
};

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post('challenge/:challengeId/submit')
  @UseGuards(BrandCollaboratorSubmitGuard, OpenChallengeGuard, NoDuplicateSubmissionGuard)
  @UseInterceptors(FileInterceptor('video', uploadOptions))
  @HttpCode(HttpStatus.CREATED)
  async createSubmission(
    @Param('challengeId') challengeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }
    return this.submissionsService.createSubmission(file, challengeId, req.user.id);
  }

  @Patch(':submissionId/shortlist')
  // Note: Need a guard that checks ownership of the challenge linked to this submission
  async shortlistSubmission(@Param('submissionId') submissionId: string) {
    return this.submissionsService.shortlistSubmission(submissionId);
  }

  @Patch(':submissionId/request-revision')
  async requestRevision(
    @Param('submissionId') submissionId: string,
    @Body() dto: RequestRevisionDto,
  ) {
    return this.submissionsService.requestRevision(submissionId, dto);
  }

  @Patch(':submissionId/revise')
  @UseGuards(CollaboratorGuard)
  @UseInterceptors(FileInterceptor('video', uploadOptions))
  async uploadRevision(
    @Param('submissionId') submissionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Revised video file is required');
    }
    return this.submissionsService.uploadRevision(submissionId, file);
  }

  @Patch(':submissionId/declare-winner')
  async declareWinner(@Param('submissionId') submissionId: string) {
    return this.submissionsService.declareWinner(submissionId);
  }

  @Patch(':submissionId/rate')
  async rateSubmission(
    @Param('submissionId') submissionId: string,
    @Body('rating') rating: number,
  ) {
    return this.submissionsService.rateSubmission(submissionId, rating);
  }

  @Get('challenge/:challengeId')
  async getSubmissionsByChallenge(@Param('challengeId') challengeId: string) {
    return this.submissionsService.getSubmissionsByChallenge(challengeId);
  }

  @Get('my')
  async getMySubmissions(@Request() req) {
    return this.submissionsService.getMySubmissions(req.user.id);
  }
}

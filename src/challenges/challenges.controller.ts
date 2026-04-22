import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto, UpdateChallengeDto } from './dto';
import { ChallengeOwnerGuard } from './guards/challenge-owner.guard';

@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChallenge(@Body() dto: CreateChallengeDto, @Request() req) {
    return this.challengesService.createChallenge(dto, req.user.id);
  }

  @Patch(':challengeId/publish')
  @UseGuards(ChallengeOwnerGuard)
  async publishChallenge(@Param('challengeId') challengeId: string) {
    return this.challengesService.publishChallenge(challengeId);
  }

  @Get('brand/:brandId')
  async getChallengesByBrand(
    @Param('brandId') brandId: string,
    @Query('status') status?: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.challengesService.getChallengesByBrand(brandId, status, limit, offset);
  }

  @Get('brand/:brandId/stats')
  async getBrandOwnerStats(@Param('brandId') brandId: string) {
    return this.challengesService.getBrandOwnerStats(brandId);
  }

  @Get('discover/all')
  async discoverChallenges(
    @Query() filters: any,
    @Request() req,
    @Query('sortBy') sortBy = 'newest',
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    // Collaborators see only challenges from brands they work with
    if (req.user.role === 'collaborator') {
      filters.collaboratorId = req.user.id;
    }
    return this.challengesService.discoverChallenges(filters, sortBy, limit, offset);
  }

  @Get(':challengeId')
  async getChallengeDetails(@Param('challengeId') challengeId: string) {
    return this.challengesService.getChallengeDetails(challengeId);
  }

  @Patch(':challengeId')
  @UseGuards(ChallengeOwnerGuard)
  async updateChallenge(
    @Param('challengeId') challengeId: string,
    @Body() dto: UpdateChallengeDto,
  ) {
    return this.challengesService.updateChallenge(challengeId, dto);
  }

  @Delete(':challengeId')
  @UseGuards(ChallengeOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChallenge(@Param('challengeId') challengeId: string) {
    return this.challengesService.deleteChallenge(challengeId);
  }
}

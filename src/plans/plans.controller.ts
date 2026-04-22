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
    HttpCode,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/schemas/user.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdateCampaignCopyDto } from './dto/update-campaign-copy.dto';
import { DashboardAlertsService } from './ai/dashboard-alerts.service';
import { DashboardAlertsRequestDto, DashboardAlertsResponseDto } from './dto/dashboard-alerts.dto';

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
    constructor(
        private readonly plansService: PlansService,
        private readonly dashboardAlertsService: DashboardAlertsService,
    ) { }

    private resolveUserId(user: User): string {
        const id = (user as any).id ?? (user as any)._id?.toString();
        if (!id) throw new UnauthorizedException('Could not resolve user identity');
        return id;
    }

    // ─── POST /plans ─────────────────────────────────────────────────────────────

    @Post()
    @Roles(UserRole.BRAND_OWNER)
    @ApiOperation({ summary: 'Create a new plan draft (standalone or for a brand)' })
    @ApiQuery({ name: 'brandId', required: false, description: 'Optional MongoDB ObjectId of the brand' })
    @ApiResponse({ status: 201, description: 'Plan created' })
    create(
        @Body() dto: CreatePlanDto,
        @CurrentUser() user: User,
        @Query('brandId') brandId?: string,
    ) {
        return this.plansService.createPlan(dto, this.resolveUserId(user), brandId);
    }

    // ─── GET /plans ──────────────────────────────────────────────────────────────

    @Get()
    @ApiOperation({ summary: 'List all plans (optionally filtered by brand)' })
    @ApiQuery({ name: 'brandId', required: false })
    findAll(
        @CurrentUser() user: User,
        @Query('brandId') brandId?: string,
    ) {
        return this.plansService.findAll(this.resolveUserId(user), brandId);
    }

    // ─── GET /plans/:id ──────────────────────────────────────────────────────────

    @Get(':id')
    @ApiParam({ name: 'id', description: 'Plan MongoDB ObjectId' })
    @ApiOperation({ summary: 'Get a plan with its phases and content blocks' })
    findOne(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.findOne(id, this.resolveUserId(user));
    }

    // ─── PATCH /plans/:id ────────────────────────────────────────────────────────

    @Patch(':id')
    @Roles(UserRole.BRAND_OWNER)
    @ApiParam({ name: 'id', description: 'Plan MongoDB ObjectId' })
    @ApiOperation({ summary: 'Update plan metadata' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdatePlanDto,
        @CurrentUser() user: User,
    ) {
        return this.plansService.updatePlan(id, dto, this.resolveUserId(user));
    }

    // ─── DELETE /plans/:id ───────────────────────────────────────────────────────

    @Delete(':id')
    @Roles(UserRole.BRAND_OWNER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'id', description: 'Plan MongoDB ObjectId' })
    @ApiOperation({ summary: 'Delete a plan and all its calendar entries' })
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.deletePlan(id, this.resolveUserId(user));
    }

    // ─── Project DNA & AI Insights ──────────────────────────────────────────────

    @Patch(':id/dna')
    @Roles(UserRole.BRAND_OWNER)
    @ApiOperation({ summary: 'Update project DNA' })
    updateDNA(@Param('id') id: string, @Body() update: any, @CurrentUser() user: User) {
        return this.plansService.updateProjectDNA(id, this.resolveUserId(user), update);
    }

    @Get(':id/ai-insights')
    @ApiOperation({ summary: 'Get AI insights for a plan' })
    getAIInsights(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.getAIInsights(id, this.resolveUserId(user));
    }

    // ─── POST /plans/:id/generate ────────────────────────────────────────────────

    @Post(':id/generate')
    @Roles(UserRole.BRAND_OWNER)
    @ApiParam({ name: 'id' })
    @ApiOperation({ summary: 'Generate plan phases + content blocks via Gemini AI' })
    @ApiResponse({ status: 200, description: 'Plan with generated phases returned' })
    generate(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.generatePlanStructure(id, this.resolveUserId(user));
    }

    // ─── POST /plans/:id/activate ────────────────────────────────────────────────

    @Post(':id/activate')
    @Roles(UserRole.BRAND_OWNER)
    @ApiParam({ name: 'id' })
    @ApiOperation({ summary: 'Activate a plan (status: draft → active)' })
    activate(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.activatePlan(id, this.resolveUserId(user));
    }

    // ─── POST /plans/:id/add-to-calendar ─────────────────────────────────────────

    @Post(':id/add-to-calendar')
    @Roles(UserRole.BRAND_OWNER)
    @ApiParam({ name: 'id' })
    @ApiOperation({ summary: 'Convert active plan blocks to calendar entries' })
    addToCalendar(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.convertPlanToCalendar(id, this.resolveUserId(user));
    }

    // ─── GET /plans/:id/calendar ─────────────────────────────────────────────────

    @Get(':id/calendar')
    @ApiParam({ name: 'id' })
    @ApiOperation({ summary: 'Get calendar entries for a plan' })
    getCalendar(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.getCalendar(id, this.resolveUserId(user));
    }

    // ─── POST /plans/:id/regenerate ──────────────────────────────────────────────

    @Post(':id/regenerate')
    @Roles(UserRole.BRAND_OWNER)
    @ApiParam({ name: 'id' })
    @ApiOperation({ summary: 'Wipe and regenerate the plan structure' })
    regenerate(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.regeneratePlan(id, this.resolveUserId(user));
    }

    // ─── POST /plans/dashboard-alerts ────────────────────────────────────────────

    @Post('dashboard-alerts')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Generate AI-powered dashboard alerts via Gemini',
        description: 'Analyzes missed posts, upcoming 24h schedule, and plan health. Results should be cached 24h on the client.',
    })
    @ApiResponse({ status: 200, type: DashboardAlertsResponseDto })
    async getDashboardAlerts(@Body() dto: DashboardAlertsRequestDto): Promise<DashboardAlertsResponseDto> {
        const alerts = await this.dashboardAlertsService.generateAlerts({
            currentDateTime: dto.currentDateTime,
            brands: dto.brands,
            plans: dto.plans,
            entries: dto.entries,
        });
        return { alerts };
    }

    // ─── GET /plans/:id/stats ────────────────────────────────────────────────────

    @Get(':id/stats')
    @ApiParam({ name: 'id' })
    @ApiOperation({ summary: 'Statistiques d\'un plan (formats, CTA, piliers, phases)' })
    getStats(@Param('id') id: string, @CurrentUser() user: User) {
        return this.plansService.getPlanStats(id, this.resolveUserId(user));
    }

    // ─── PATCH /plans/:id/campaign-copy ─────────────────────────────────────────

    @Patch(':id/campaign-copy')
    @Roles(UserRole.BRAND_OWNER)
    @ApiParam({ name: 'id' })
    @ApiOperation({
        summary: 'Save chosen campaign slogan and/or launch headline to a plan',
        description: 'Call this after generating campaign copy via POST /slogan-generator/campaign. Stores the chosen slogan/headline on the Plan document.',
    })
    @ApiResponse({ status: 200, description: 'Plan updated with campaign copy' })
    updateCampaignCopy(
        @Param('id') id: string,
        @Body() dto: UpdateCampaignCopyDto,
        @CurrentUser() user: User,
    ) {
        return this.plansService.updateCampaignCopy(id, dto, this.resolveUserId(user));
    }
}

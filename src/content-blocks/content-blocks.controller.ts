import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { ContentBlocksService } from './content-blocks.service';
import { CreateContentBlockDto } from './dto/create-content-block.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AttachPlanDto } from './dto/attach-plan.dto';
import { ScheduleDto } from './dto/schedule.dto';
import { ReplaceDto } from './dto/replace.dto';
import { ContentBlockStatus } from './schemas/content-block.schema';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Content Blocks')
// @UseGuards(JwtAuthGuard)  // Enable when auth is required in production
// @ApiBearerAuth()
@Controller('content-blocks')
export class ContentBlocksController {
    constructor(private readonly svc: ContentBlocksService) { }

    // ─── POST /content-blocks ─────────────────────────────────────────────────

    @Post()
    @ApiOperation({
        summary: 'Create a ContentBlock (Save as Idea)',
        description: 'Saves a generated AI video idea as a ContentBlock with status="idea". If scheduledAt is provided, status is automatically set to "scheduled".',
    })
    @ApiResponse({ status: 201, description: 'ContentBlock created' })
    create(@Request() req, @Body() dto: CreateContentBlockDto) {
        const userId = req.user ? (req.user.userId || req.user._id) : 'anonymous';
        return this.svc.create(dto, userId);
    }

    // ─── GET /content-blocks ──────────────────────────────────────────────────

    @Get()
    @ApiOperation({ summary: 'List ContentBlocks for the current user' })
    @ApiQuery({ name: 'brandId', required: false })
    @ApiQuery({ name: 'planId', required: false })
    @ApiQuery({ name: 'status', required: false, enum: ContentBlockStatus })
    @ApiResponse({ status: 200, description: 'Array of ContentBlocks' })
    findAll(
        @Request() req,
        @Query('brandId') brandId?: string,
        @Query('planId') planId?: string,
        @Query('status') status?: ContentBlockStatus,
    ) {
        const userId = req.user ? (req.user.userId || req.user._id) : 'anonymous';
        return this.svc.findAll(userId, { brandId, planId, status });
    }

    // ─── GET /content-blocks/:id ──────────────────────────────────────────────

    @Get(':id')
    @ApiOperation({ summary: 'Get a single ContentBlock by ID' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 404 })
    findOne(@Request() req, @Param('id') id: string) {
        const userId = req.user ? (req.user.userId || req.user._id) : 'anonymous';
        return this.svc.findOne(id, userId);
    }

    // ─── PATCH /content-blocks/:id/status ────────────────────────────────────

    @Patch(':id/status')
    @ApiOperation({
        summary: 'Update ContentBlock status',
        description: 'Enforces allowed transitions: idea→approved→scheduled→in_process; any→terminated.',
    })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 400, description: 'Invalid transition' })
    updateStatus(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: UpdateStatusDto,
    ) {
        const userId = req.user ? (req.user.userId || req.user._id) : 'anonymous';
        return this.svc.updateStatus(id, dto, userId);
    }

    // ─── POST /content-blocks/:id/attach-plan ─────────────────────────────────

    @Post(':id/attach-plan')
    @ApiOperation({
        summary: 'Attach ContentBlock to a Plan/Phase',
        description: 'Sets planId + optional phaseId. Automatically advances status idea→approved.',
    })
    @ApiResponse({ status: 200 })
    attachPlan(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: AttachPlanDto,
    ) {
        const userId = req.user ? (req.user.userId || req.user._id) : 'anonymous';
        return this.svc.attachPlan(id, dto, userId);
    }

    // ─── POST /content-blocks/:id/schedule ───────────────────────────────────

    @Post(':id/schedule')
    @ApiOperation({
        summary: 'Schedule a ContentBlock',
        description: 'Sets scheduledAt and transitions status to "scheduled". Block must be in approved or scheduled state.',
    })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 400 })
    scheduleBlock(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: ScheduleDto,
    ) {
        const userId = req.user ? (req.user.userId || req.user._id) : 'anonymous';
        return this.svc.schedule(id, dto, userId);
    }

    // ─── POST /content-blocks/:id/replace ────────────────────────────────────

    @Post(':id/replace')
    @ApiOperation({
        summary: 'Replace an existing scheduled post with this block\'s content',
        description: 'Copies title/hooks/scriptOutline from the source block into the target block. Target keeps its scheduledAt and status.',
    })
    @ApiResponse({ status: 200 })
    replace(
        @Request() req,
        @Param('id') id: string,
        @Body() dto: ReplaceDto,
    ) {
        const userId = req.user ? (req.user.userId || req.user._id) : 'anonymous';
        return this.svc.replace(id, dto, userId);
    }

    // ─── DELETE /content-blocks/:id ───────────────────────────────────────────

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a ContentBlock' })
    @ApiResponse({ status: 204 })
    @ApiResponse({ status: 404 })
    remove(@Request() req, @Param('id') id: string) {
        const userId = req.user ? (req.user.userId || req.user._id) : 'anonymous';
        return this.svc.remove(id, userId);
    }
}

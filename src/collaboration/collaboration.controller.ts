import { Controller, Post, Get, Delete, Body, Param, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '../users/schemas/user.schema';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CollaborationService } from './collaboration.service';
import { IsString, IsOptional } from 'class-validator';
import { DeliverableStatus } from './schemas/deliverable.schema';

class InviteDto {
    @IsString()
    planId: string;

    @IsString()
    inviteeId: string;

    @IsOptional()
    @IsString()
    role?: string;
}

@ApiTags('Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('collaboration')
export class CollaborationController {
    constructor(private readonly collaborationService: CollaborationService) {}

    @Post('invite')
    @Roles(UserRole.BRAND_OWNER)
    @ApiOperation({ summary: 'Invite a user to collaborate on a plan' })
    async inviteCollaborator(@CurrentUser() user: any, @Body() body: InviteDto) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.inviteCollaborator(body.planId, userId, body.inviteeId, body.role);
    }

    @Post('invitations/:id/accept')
    @ApiOperation({ summary: 'Accept a pending collaboration invitation' })
    async acceptInvitation(@CurrentUser() user: any, @Param('id') invitationId: string) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.acceptInvitation(invitationId, userId);
    }

    @Post('plans/:planId/accept-invite')
    @ApiOperation({ summary: 'Accept pending invitation for a plan (lookup by planId)' })
    async acceptInvitationByPlan(@CurrentUser() user: any, @Param('planId') planId: string) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.acceptInvitationByPlan(planId, userId);
    }

    @Post('invitations/:id/decline')
    @ApiOperation({ summary: 'Decline a pending collaboration invitation' })
    async declineInvitation(@CurrentUser() user: any, @Param('id') invitationId: string) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.declineInvitation(invitationId, userId);
    }

    @Get('plans/:planId/collaborators')
    @ApiOperation({ summary: 'List collaborators for a plan' })
    async getCollaborators(@CurrentUser() user: any, @Param('planId') planId: string) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.getCollaborators(planId, userId);
    }

    @Delete('plans/:planId/collaborators/:userId')
    @Roles(UserRole.BRAND_OWNER)
    @ApiOperation({ summary: 'Remove a collaborator from a plan (Owner only)' })
    async removeCollaborator(@CurrentUser() user: any, @Param('planId') planId: string, @Param('userId') userToRemove: string) {
        const ownerId = user.id || user._id?.toString();
        return this.collaborationService.removeCollaborator(planId, ownerId, userToRemove);
    }

    @Get('plans/:planId/activity')
    @ApiOperation({ summary: 'Get activity log for a plan' })
    async getActivityLog(@CurrentUser() user: any, @Param('planId') planId: string) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.getActivityLog(planId, userId);
    }

    @Get('my-collaborations')
    @ApiOperation({ summary: 'Get all plans the current user joined as collaborator' })
    async getMyCollaborationPlans(@CurrentUser() user: any) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.getMyCollaborationPlans(userId);
    }

    @Get('notifications')
    @ApiOperation({ summary: 'Get in-app notifications for the user' })
    async getNotifications(@CurrentUser() user: any) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.getNotifications(userId);
    }

    @Patch('notifications/:id/read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    async markNotificationRead(@CurrentUser() user: any, @Param('id') id: string) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.markNotificationRead(id, userId);
    }

    @Get('shared/:targetId')
    @ApiOperation({ summary: 'Get shared plans between the current user and another user' })
    async getSharedPlans(@CurrentUser() user: any, @Param('targetId') targetId: string) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.getSharedPlans(userId, targetId);
    }

    // ─── Tasks ──────────────────────────────────────────────────────────────────
    @Post('plans/:planId/tasks')
    @Roles(UserRole.BRAND_OWNER)
    @ApiOperation({ summary: 'Create a task for a plan' })
    async createTask(@CurrentUser() user: any, @Param('planId') planId: string, @Body() body: any) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.createTask(planId, userId, body);
    }

    @Get('plans/:planId/tasks')
    @ApiOperation({ summary: 'Get all tasks for a plan' })
    async getTasks(@CurrentUser() user: any, @Param('planId') planId: string) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.getTasks(planId, userId);
    }

    @Patch('tasks/:id')
    @ApiOperation({ summary: 'Update a task' })
    async updateTask(@CurrentUser() user: any, @Param('id') id: string, @Body() body: any) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.updateTask(id, userId, body);
    }

    // ─── Deliverables ───────────────────────────────────────────────────────────
    @Post('tasks/:taskId/deliverables')
    @ApiOperation({ summary: 'Submit a deliverable for a task' })
    async submitDeliverable(@CurrentUser() user: any, @Param('taskId') taskId: string, @Body() body: any) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.submitDeliverable(taskId, userId, body);
    }

    @Patch('deliverables/:id/review')
    @Roles(UserRole.BRAND_OWNER)
    @ApiOperation({ summary: 'Review (approve/reject) a deliverable' })
    async reviewDeliverable(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: DeliverableStatus; feedback?: string }) {
        const userId = user.id || user._id?.toString();
        return this.collaborationService.reviewDeliverable(id, userId, body.status, body.feedback);
    }
}

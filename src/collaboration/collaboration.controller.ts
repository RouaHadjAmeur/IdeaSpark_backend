import { Controller, Post, Get, Delete, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CollaborationService } from './collaboration.service';

class InviteDto {
    planId: string;
    inviteeId: string;
    role?: string;
}

@ApiTags('Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collaboration')
export class CollaborationController {
    constructor(private readonly collaborationService: CollaborationService) {}

    @Post('invite')
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
}

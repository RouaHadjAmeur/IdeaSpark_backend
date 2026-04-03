import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlanCollaborationService } from './plan-collaboration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AddHistoryDto } from './dto/add-history.dto';

@ApiTags('Collaboration')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('collaboration')
export class PlanCollaborationController {
  constructor(private readonly service: PlanCollaborationService) {}

  // ─── Members ────────────────────────────────────────────────────────────────

  @Post('invite')
  @ApiOperation({ summary: 'Inviter un membre par email' })
  invite(@Body() dto: InviteMemberDto, @Request() req: any) {
    const user = req.user;
    return this.service.inviteMember(dto, user.name || user.email, user._id || user.id);
  }

  @Get(':planId/members')
  @ApiOperation({ summary: 'Récupérer tous les membres d\'un plan' })
  getMembers(@Param('planId') planId: string) {
    return this.service.getMembers(planId);
  }

  @Patch(':planId/members/:memberId')
  @ApiOperation({ summary: 'Modifier le rôle d\'un membre' })
  updateRole(
    @Param('planId') planId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.service.updateMemberRole(planId, memberId, dto.role);
  }

  @Delete(':planId/members/:memberId')
  @ApiOperation({ summary: 'Retirer un membre du plan' })
  removeMember(@Param('planId') planId: string, @Param('memberId') memberId: string) {
    return this.service.removeMember(planId, memberId);
  }

  // ─── Accept invitation (public) ──────────────────────────────────────────────

  @Get('accept/:token')
  @ApiOperation({ summary: 'Accepter une invitation (via lien email)' })
  acceptInvitation(@Param('token') token: string) {
    return this.service.acceptInvitation(token);
  }

  // ─── Comments ────────────────────────────────────────────────────────────────

  @Get('comments/:postId')
  @ApiOperation({ summary: 'Récupérer les commentaires d\'un post' })
  getComments(@Param('postId') postId: string) {
    return this.service.getComments(postId);
  }

  @Post('comments')
  @ApiOperation({ summary: 'Ajouter un commentaire ou une action' })
  addComment(@Body() dto: AddCommentDto, @Request() req: any) {
    const user = req.user;
    return this.service.addComment(dto, user._id || user.id, user.name || user.email);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.service.deleteComment(commentId, req.user._id || req.user.id);
  }

  // ─── History ─────────────────────────────────────────────────────────────────

  @Get(':planId/history')
  @ApiOperation({ summary: 'Récupérer l\'historique d\'un plan' })
  getHistory(@Param('planId') planId: string) {
    return this.service.getHistory(planId);
  }

  @Post(':planId/history')
  @ApiOperation({ summary: 'Ajouter une entrée dans l\'historique' })
  addHistory(@Param('planId') planId: string, @Body() dto: AddHistoryDto, @Request() req: any) {
    const user = req.user;
    return this.service.addHistoryFromDto(planId, dto, user._id || user.id, user.name || user.email);
  }
}

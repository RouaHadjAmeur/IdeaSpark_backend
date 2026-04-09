import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('invitations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer une invitation d\'amitié' })
  create(@Body() createInvitationDto: CreateInvitationDto, @Request() req) {
    return this.invitationService.create(createInvitationDto, req.user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Liste des invitations reçues en attente' })
  findPending(@Request() req) {
    return this.invitationService.findPending(req.user.id);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accepter une invitation' })
  accept(@Param('id') id: string) {
    return this.invitationService.acceptInvitation(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Refuser une invitation' })
  reject(@Param('id') id: string) {
    return this.invitationService.rejectInvitation(id);
  }
}

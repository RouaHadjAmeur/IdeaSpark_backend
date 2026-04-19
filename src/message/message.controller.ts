import { Controller, Get, Param, Query, UseGuards, Request, Patch, Body } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('conversation/:receiverId')
  @ApiOperation({ summary: 'Récupérer l\'historique d\'une conversation' })
  getConversation(
    @Param('receiverId') receiverId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Request() req,
  ) {
    return this.messageService.getConversation(req.user.id, receiverId, page, limit);
  }

  // Admin Supervision Endpoints
  @Get('admin/stats')
  @ApiOperation({ summary: 'Récupérer les statistiques globales de messagerie (Admin)' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getAdminStats() {
    return this.messageService.getAdminStats();
  }

  @Get('admin/reported')
  @ApiOperation({ summary: 'Récupérer les messages signalés (Admin)' })
  @ApiResponse({ status: 200, description: 'Messages signalés récupérés avec succès' })
  async getReportedMessages() {
    return this.messageService.getReportedMessages();
  }

  @Patch('admin/:id/action')
  @ApiOperation({ summary: 'Traiter un message signalé (Admin)' })
  @ApiResponse({ status: 200, description: 'Action effectuée avec succès' })
  async handleReportedAction(
    @Param('id') id: string,
    @Body('action') action: 'delete' | 'ignore',
  ) {
    return this.messageService.handleReportedAction(id, action);
  }
}

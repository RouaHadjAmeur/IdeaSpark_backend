import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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
}

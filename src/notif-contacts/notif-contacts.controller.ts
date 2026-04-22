import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotifContactsService } from './notif-contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('notifications-contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications-contacts')
export class NotifContactsController {
  constructor(private readonly notifContactsService: NotifContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste de mes notifications' })
  findAll(@Request() req) {
    return this.notifContactsService.findAllByUser(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markAsRead(@Param('id') id: string) {
    return this.notifContactsService.markAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  remove(@Param('id') id: string) {
    return this.notifContactsService.remove(id);
  }
}

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ScheduleNotificationDto } from './dto/schedule-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('register-token')
  @ApiOperation({ summary: 'Enregistrer le token FCM de l\'appareil' })
  registerToken(@Body() dto: RegisterTokenDto, @Request() req: any) {
    return this.service.registerToken(req.user._id || req.user.id, dto);
  }

  @Post('send')
  @ApiOperation({ summary: 'Envoyer une notification push' })
  send(@Body() dto: SendNotificationDto) {
    return this.service.sendNotification(dto);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Planifier une notification' })
  schedule(@Body() dto: ScheduleNotificationDto, @Request() req: any) {
    return this.service.scheduleNotification(req.user._id || req.user.id, dto);
  }
}

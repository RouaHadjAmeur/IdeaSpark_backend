import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { FcmToken, FcmTokenDocument } from './schemas/fcm-token.schema';
import { ScheduledNotification, ScheduledNotificationDocument } from './schemas/scheduled-notification.schema';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ScheduleNotificationDto } from './dto/schedule-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(FcmToken.name) private tokenModel: Model<FcmTokenDocument>,
    @InjectModel(ScheduledNotification.name) private scheduledModel: Model<ScheduledNotificationDocument>,
    private configService: ConfigService,
  ) {}

  async registerToken(userId: string, dto: RegisterTokenDto) {
    await this.tokenModel.findOneAndUpdate(
      { fcmToken: dto.fcmToken },
      { userId, fcmToken: dto.fcmToken, platform: dto.platform },
      { upsert: true, new: true },
    );
    return { success: true };
  }

  async sendNotification(dto: SendNotificationDto) {
    const tokens = await this.tokenModel.find({ userId: dto.userId });
    if (!tokens.length) {
      this.logger.warn(`No FCM tokens found for user ${dto.userId}`);
      return { success: false, message: 'No tokens registered for this user' };
    }

    const results = await Promise.allSettled(
      tokens.map(t => this.sendFcmMessage(t.fcmToken, dto.title, dto.body, dto.data)),
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    return { success: sent > 0, sent, total: tokens.length };
  }

  async scheduleNotification(userId: string, dto: ScheduleNotificationDto) {
    const notification = await this.scheduledModel.create({
      userId,
      planId: dto.planId,
      title: dto.title,
      body: dto.body,
      scheduledAt: new Date(dto.scheduledAt),
    });
    return notification;
  }

  private async sendFcmMessage(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    if (!projectId) {
      this.logger.log(`[FCM Mock] To: ${token} | Title: ${title} | Body: ${body}`);
      return;
    }

    // Envoi via Firebase HTTP v1 API
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const message = {
      message: {
        token,
        notification: { title, body },
        data: data || {},
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`FCM error: ${err}`);
    }
  }
}

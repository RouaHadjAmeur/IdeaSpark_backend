import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmToken, FcmTokenSchema } from './schemas/fcm-token.schema';
import { ScheduledNotification, ScheduledNotificationSchema } from './schemas/scheduled-notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FcmToken.name, schema: FcmTokenSchema },
      { name: ScheduledNotification.name, schema: ScheduledNotificationSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

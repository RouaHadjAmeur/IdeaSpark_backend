import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotifContactsService } from './notif-contacts.service';
import { NotifContactsController } from './notif-contacts.controller';
import { NotifContacts, NotifContactsSchema } from '../schemas/notif-contacts.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotifContacts.name, schema: NotifContactsSchema },
    ]),
  ],
  controllers: [NotifContactsController],
  providers: [NotifContactsService],
  exports: [NotifContactsService],
})
export class NotifContactsModule {}

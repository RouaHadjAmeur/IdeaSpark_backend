import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotifContacts, NotifContactsDocument } from '../schemas/notif-contacts.schema';
import { CreateNotifContactsDto } from './dto/create-notif-contacts.dto';

@Injectable()
export class NotifContactsService {
  constructor(
    @InjectModel(NotifContacts.name)
    private notifContactsModel: Model<NotifContactsDocument>,
  ) {}

  async create(createDto: CreateNotifContactsDto): Promise<NotifContacts> {
    const newNotif = new this.notifContactsModel(createDto);
    return newNotif.save();
  }

  async findAllByUser(userId: string): Promise<NotifContacts[]> {
    return this.notifContactsModel
      .find({ user: userId } as any)
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string): Promise<NotifContacts> {
    const updated = await this.notifContactsModel
      .findByIdAndUpdate(id, { read: true }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`Notification #${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.notifContactsModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Notification #${id} not found`);
  }
}

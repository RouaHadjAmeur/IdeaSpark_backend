import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  async create(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {
    const newMessage = new this.messageModel({
      ...createMessageDto,
      sender: senderId,
    });
    return newMessage.save();
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageModel
      .findById(id)
      .populate('sender', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture')
      .exec();
    if (!message) throw new NotFoundException(`Message #${id} not found`);
    return message;
  }

  async markAsRead(id: string): Promise<Message> {
    const message = await this.messageModel
      .findByIdAndUpdate(id, { isRead: true }, { new: true })
      .exec();
    if (!message) throw new NotFoundException(`Message #${id} not found`);
    return message;
  }

  async getConversation(userId1: string, userId2: string, page = 1, limit = 20): Promise<{ messages: Message[], total: number, page: number, limit: number }> {
    const skip = (page - 1) * limit;
    
    const filter = {
      isDeleted: false,
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 }
      ]
    };

    const messages = await this.messageModel
      .find(filter)
      .populate('sender', 'name email profilePicture')
      .populate('receiver', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.messageModel.countDocuments(filter).exec();

    return {
      messages,
      total,
      page,
      limit,
    };
  }

  // Admin Supervision Methods
  async getAdminStats(): Promise<any> {
    const totalMessages = await this.messageModel.countDocuments().exec();
    
    const statsByType = await this.messageModel.aggregate([
      { $group: { _id: '$messageType', count: { $sum: 1 } } }
    ]);

    const deletedCount = await this.messageModel.countDocuments({ isDeleted: true }).exec();
    const unreadCount = await this.messageModel.countDocuments({ isRead: false }).exec();

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const volumeHistory = await this.messageModel.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const reportedToProcess = await this.messageModel.countDocuments({ isReported: true, isDeleted: false }).exec();

    return {
      totalMessages,
      statsByType: statsByType.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      deletedRate: totalMessages > 0 ? (deletedCount / totalMessages) * 100 : 0,
      unreadRate: totalMessages > 0 ? (unreadCount / totalMessages) * 100 : 0,
      volumeHistory,
      reportedToProcess,
    };
  }

  async getReportedMessages(): Promise<Message[]> {
    return this.messageModel
      .find({ isReported: true, isDeleted: false })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .select('-content') // Important for privacy
      .sort({ createdAt: -1 })
      .exec();
  }

  async handleReportedAction(id: string, action: 'delete' | 'ignore'): Promise<Message> {
    const update = action === 'delete' ? { isDeleted: true, isReported: false } : { isReported: false };
    const message = await this.messageModel.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!message) throw new NotFoundException(`Message #${id} not found`);
    return message;
  }
}

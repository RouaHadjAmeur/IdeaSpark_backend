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
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Log, LogDocument } from './schemas/log.schema';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<LogDocument>,
  ) {}

  async createLog(
    userId: string | Types.ObjectId,
    action: string,
    details: string,
    targetUserId?: string | Types.ObjectId,
    ip?: string,
  ): Promise<LogDocument> {
    const log = new this.logModel({
      userId: new Types.ObjectId(userId.toString()),
      action,
      details,
      targetUserId: targetUserId ? new Types.ObjectId(targetUserId.toString()) : undefined,
      ip,
    });
    return await log.save();
  }

  async findAll(query?: string, startDate?: string, endDate?: string): Promise<LogDocument[]> {
    const filter: any = {};

    if (query && query.trim() !== '') {
      const searchRegex = { $regex: query.trim(), $options: 'i' };
      filter.$or = [
        { action: searchRegex },
        { details: searchRegex },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    return this.logModel
      .find(filter)
      .populate('userId', 'name email role')
      .populate('targetUserId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200)
      .exec();
  }
}

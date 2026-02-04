import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    try {
      const user = new this.userModel(userData);
      return await user.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .select('+password')
      .exec();
  }

  async findByEmailWithVerification(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .select('+password +emailVerificationCode +emailVerificationCodeExpiresAt')
      .exec();
  }

  async setVerificationCode(
    email: string,
    code: string,
    expiresAt: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { email },
        { $set: { emailVerificationCode: code, emailVerificationCodeExpiresAt: expiresAt } },
        { new: true },
      )
      .exec();
  }

  async activateUserAndClearCode(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { email },
        {
          $set: { status: 'active' },
          $unset: { emailVerificationCode: 1, emailVerificationCodeExpiresAt: 1 },
        },
        { new: true },
      )
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByAuth0Sub(auth0Sub: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ auth0Sub }).exec();
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

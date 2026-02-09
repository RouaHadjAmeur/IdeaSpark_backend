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

  async findByAuth0SubWithVerification(auth0Sub: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ auth0Sub })
      .select('+emailVerificationCode +emailVerificationCodeExpiresAt')
      .exec();
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

  async setDeleteAccountCode(
    userId: string,
    code: string,
    expiresAt: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { deleteAccountCode: code, deleteAccountCodeExpiresAt: expiresAt } },
        { new: true },
      )
      .select('+deleteAccountCode +deleteAccountCodeExpiresAt')
      .exec();
  }

  async findByIdWithDeleteCode(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findById(userId)
      .select('+deleteAccountCode +deleteAccountCodeExpiresAt')
      .exec();
  }

  async verifyAndClearDeleteCode(userId: string, code: string): Promise<boolean> {
    const user = await this.findByIdWithDeleteCode(userId);
    if (!user) return false;
    const doc = user as any;
    const stored = doc.deleteAccountCode;
    const expiresAt = doc.deleteAccountCodeExpiresAt as Date | undefined;
    if (!stored || !expiresAt || new Date() > expiresAt) return false;
    if (stored !== code) return false;
    await this.userModel
      .findByIdAndUpdate(userId, {
        $unset: { deleteAccountCode: 1, deleteAccountCodeExpiresAt: 1 },
      })
      .exec();
    return true;
  }

  async deleteById(userId: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(userId).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async setResetPasswordCode(
    email: string,
    code: string,
    expiresAt: Date,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { email },
        { $set: { resetPasswordCode: code, resetPasswordCodeExpiresAt: expiresAt } },
        { new: true },
      )
      .select('+resetPasswordCode +resetPasswordCodeExpiresAt')
      .exec();
  }

  async findByEmailWithResetCode(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email })
      .select('+password +resetPasswordCode +resetPasswordCodeExpiresAt')
      .exec();
  }

  async verifyResetCodeAndSetPassword(
    email: string,
    code: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const user = await this.findByEmailWithResetCode(email);
    if (!user) return false;
    const doc = user as any;
    const stored = doc.resetPasswordCode;
    const expiresAt = doc.resetPasswordCodeExpiresAt as Date | undefined;
    if (!stored || !expiresAt || new Date() > expiresAt) return false;
    if (stored !== code) return false;
    await this.userModel
      .findOneAndUpdate(
        { email },
        {
          $set: { password: hashedPassword },
          $unset: { resetPasswordCode: 1, resetPasswordCodeExpiresAt: 1 },
        },
      )
      .exec();
    return true;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { password: hashedPassword } },
        { new: true },
      )
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

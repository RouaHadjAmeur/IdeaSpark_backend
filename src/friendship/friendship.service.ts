import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Friendship, FriendshipDocument } from '../schemas/friendship.schema';
import { CreateFriendshipDto } from './dto/create-friendship.dto';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectModel(Friendship.name) private friendshipModel: Model<FriendshipDocument>,
  ) {}

  async create(createFriendshipDto: CreateFriendshipDto): Promise<Friendship> {
    if (createFriendshipDto.user1 === createFriendshipDto.user2) {
      throw new Error('Un utilisateur ne peut pas être ami avec lui-même');
    }

    const existingFriendship = await this.isFriend(createFriendshipDto.user1, createFriendshipDto.user2);
    if (existingFriendship) {
      throw new Error('Ces utilisateurs sont déjà amis');
    }

    const newFriendship = new this.friendshipModel(createFriendshipDto);
    return newFriendship.save();
  }

  async getFriends(userId: string): Promise<Friendship[]> {
    return this.friendshipModel
      .find({
        $or: [{ user1: userId }, { user2: userId }],
      } as any)
      .populate('user1 user2')
      .exec();
  }

  async isFriend(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.friendshipModel
      .findOne({
        $or: [
          { user1: userId1, user2: userId2 },
          { user1: userId2, user2: userId1 },
        ],
      } as any)
      .exec();
    return !!friendship;
  }

  async removeFriend(userId1: string, userId2: string): Promise<void> {
    const result = await this.friendshipModel
      .findOneAndDelete({
        $or: [
          { user1: userId1, user2: userId2 },
          { user1: userId2, user2: userId1 },
        ],
      } as any)
      .exec();
    if (!result) {
      throw new NotFoundException(`Amitié non trouvée`);
    }
  }
}

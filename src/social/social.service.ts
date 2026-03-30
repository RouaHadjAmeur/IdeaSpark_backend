import { Injectable, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Follower, FollowerDocument } from './schemas/follower.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SocialPostsService } from '../social-posts/social-posts.service';
import { Notification, NotificationDocument } from '../collaboration/schemas/notification.schema';
import { FollowStatus } from './schemas/follower.schema';
import { CollaborationService } from '../collaboration/collaboration.service';

@Injectable()
export class SocialService {
    constructor(
        @InjectModel(Follower.name) private followerModel: Model<FollowerDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        private socialPostsService: SocialPostsService,
        @Inject(forwardRef(() => CollaborationService))
        private collaborationService: CollaborationService,
    ) { }

    async followUser(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw new BadRequestException('You cannot follow yourself');
        }

        try {
            const follower = await this.followerModel.create({
                followerId: new Types.ObjectId(followerId),
                followingId: new Types.ObjectId(followingId),
                status: FollowStatus.PENDING,
            });

            // Create notification for follow request
            await this.notificationModel.create({
                userId: new Types.ObjectId(followingId),
                type: 'follow_request',
                message: `wants to follow you.`,
                relatedUserId: new Types.ObjectId(followerId),
            });

            return follower;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('A follow request is already pending or you are already following this user');
            }
            throw error;
        }
    }

    async acceptFollowRequest(followingId: string, followerId: string) {
        const follow = await this.followerModel.findOneAndUpdate(
            { 
                followerId: new Types.ObjectId(followerId), 
                followingId: new Types.ObjectId(followingId),
                status: FollowStatus.PENDING 
            },
            { $set: { status: FollowStatus.ACCEPTED } },
            { new: true }
        ).exec();

        if (!follow) {
            throw new BadRequestException('Pending follow request not found');
        }

        // Notify follower that request was accepted
        await this.notificationModel.create({
            userId: new Types.ObjectId(followerId),
            type: 'follow_accepted',
            message: `accepted your follow request.`,
            relatedUserId: new Types.ObjectId(followingId),
        });

        return { success: true };
    }

    async getPendingFollowRequests(userId: string) {
        return this.followerModel.find({ 
            followingId: new Types.ObjectId(userId),
            status: FollowStatus.PENDING 
        })
        .populate('followerId', 'name username profile_img role skills interests')
        .exec();
    }

    async unfollowUser(followerId: string, followingId: string) {
        const result = await this.followerModel.findOneAndDelete({
            followerId: new Types.ObjectId(followerId),
            followingId: new Types.ObjectId(followingId),
        }).exec();
        
        if (!result) {
            throw new BadRequestException('You are not following this user');
        }
        return { success: true };
    }

    async getFollowing(userId: string) {
        const follows = await this.followerModel.find({ 
            followerId: new Types.ObjectId(userId),
            status: FollowStatus.ACCEPTED
        })
            .populate('followingId', 'name username profile_img role skills interests')
            .exec();
        return follows.map(f => f.followingId);
    }

    async getFollowers(userId: string) {
        const follows = await this.followerModel.find({ 
            followingId: new Types.ObjectId(userId),
            status: FollowStatus.ACCEPTED
        })
            .populate('followerId', 'name username profile_img role')
            .exec();
        return follows.map(f => f.followerId);
    }

    async getCommunityFeed(userId: string) {
        const following = await this.followerModel.find({ 
            followerId: new Types.ObjectId(userId),
            status: FollowStatus.ACCEPTED
        }).select('followingId').exec();
        const followingIds = following.map(f => f.followingId.toString());
        
        // Include self posts in the feed too? usually yes
        followingIds.push(userId);

        return this.socialPostsService.findFeedPosts(followingIds);
    }

    async getFollowersById(userId: string) {
        return this.getFollowers(userId);
    }

    async getFollowingById(userId: string) {
        return this.getFollowing(userId);
    }

    async getFriends(userId: string) {
        if (!userId || !Types.ObjectId.isValid(userId)) return [];

        // Find all accepted followers of userId
        const [followingDocs, followerDocs] = await Promise.all([
            this.followerModel.find({ followerId: new Types.ObjectId(userId), status: FollowStatus.ACCEPTED }).select('followingId').exec(),
            this.followerModel.find({ followingId: new Types.ObjectId(userId), status: FollowStatus.ACCEPTED }).select('followerId').exec(),
        ]);

        const followingSet = new Set(followingDocs.map(f => f.followingId.toString()));
        const mutualIds = followerDocs
            .map(f => f.followerId.toString())
            .filter(id => followingSet.has(id));

        if (mutualIds.length === 0) return [];

        const friends = await this.userModel
            .find({ _id: { $in: mutualIds.map(id => new Types.ObjectId(id)) } })
            .select('name username profile_img role skills interests')
            .exec();

        return friends;
    }

    async getFriendsWithSharedPlans(userId: string) {
        const friends = await this.getFriends(userId);
        return Promise.all(
            friends.map(async (friend) => {
                const sharedPlans = await this.collaborationService.getSharedPlans(userId, friend._id.toString());
                return { ...friend.toObject(), sharedPlans };
            })
        );
    }

    async getSuggestions(userId: string) {
        const currentUser = await this.userModel.findById(userId).exec();
        if (!currentUser) return [];

        const following = await this.followerModel.find({ followerId: new Types.ObjectId(userId) }).select('followingId').exec();
        const followingIds = following.map(f => f.followingId.toString());
        followingIds.push(userId); // exclude self

        // Find users with overlapping skills or interests
        return this.userModel.find({
            _id: { $nin: followingIds },
            status: 'active',
            $or: [
                { skills: { $in: currentUser.skills || [] } },
                { interests: { $in: currentUser.interests || [] } }
            ]
        })
        .select('name username profile_img role skills interests')
        .limit(10)
        .exec();
    }
}

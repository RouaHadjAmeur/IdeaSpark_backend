import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SocialPost, SocialPostDocument } from './schemas/social-post.schema';

@Injectable()
export class SocialPostsService {
    constructor(
        @InjectModel(SocialPost.name) private postModel: Model<SocialPostDocument>,
    ) { }

    /**
     * Called by n8n when a video/slogan is approved.
     * Saves the formatted social post to the database.
     */
    async createPost(data: Partial<SocialPost>): Promise<SocialPost> {
        return this.postModel.create(data);
    }

    /**
     * Called by Flutter to get all ready-to-share posts for a user.
     */
    async getUserPosts(userId?: string): Promise<SocialPost[]> {
        const filter = userId ? { userId } : {};
        return this.postModel.find(filter).sort({ createdAt: -1 }).limit(20).exec();
    }

    /**
     * Mark a post as published after user shares it.
     */
    async markPublished(postId: string): Promise<SocialPost | null> {
        return this.postModel.findByIdAndUpdate(
            postId,
            { status: 'published', publishedAt: new Date() },
            { new: true },
        ).exec();
    }
}

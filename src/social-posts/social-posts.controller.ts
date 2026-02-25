import {
    Controller, Get, Post, Patch, Body, Param, Query,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialPostsService } from './social-posts.service';

@Controller('social-posts')
export class SocialPostsController {
    constructor(
        private readonly postsService: SocialPostsService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Called by n8n webhook to save a formatted social post.
     * POST /social-posts/create?secret=xxx
     */
    @Post('create')
    async createPost(
        @Body() body: { content: string; source: string; sourceData?: any; hashtags?: string[] },
        @Query('secret') secret: string,
    ) {
        const expectedSecret = this.configService.get<string>('N8N_SECRET') || '';
        if (expectedSecret && secret !== expectedSecret) {
            throw new UnauthorizedException('Invalid n8n secret');
        }
        const post = await this.postsService.createPost(body);
        return { success: true, postId: post['_id'] };
    }

    /**
     * Called by Flutter app to get ready-to-share posts.
     * GET /social-posts
     */
    @Get()
    async getPosts(@Query('userId') userId?: string) {
        return this.postsService.getUserPosts(userId);
    }

    /**
     * Called by Flutter after user shares a post.
     * PATCH /social-posts/:id/publish
     */
    @Patch(':id/publish')
    async markPublished(@Param('id') id: string) {
        const post = await this.postsService.markPublished(id);
        return { success: true, post };
    }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialPost, SocialPostSchema } from './schemas/social-post.schema';
import { SocialPostsService } from './social-posts.service';
import { SocialPostsController } from './social-posts.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: SocialPost.name, schema: SocialPostSchema }]),
    ],
    controllers: [SocialPostsController],
    providers: [SocialPostsService],
    exports: [SocialPostsService],
})
export class SocialPostsModule { }

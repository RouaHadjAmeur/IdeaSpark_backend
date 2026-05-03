import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdvancedShareController } from './advanced-share.controller';
import { AdvancedShareService } from './advanced-share.service';
import { ScheduledPost, ScheduledPostSchema } from './schemas/scheduled-post.schema';
import { SocialAccount, SocialAccountSchema } from './schemas/social-account.schema';
import { InstagramAccount, InstagramAccountSchema } from '../instagram-auth/schemas/instagram-account.schema';
import { YoutubeAccount, YoutubeAccountSchema } from '../youtube-auth/schemas/youtube-account.schema';
import { InstagramAuthModule } from '../instagram-auth/instagram-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScheduledPost.name, schema: ScheduledPostSchema },
      { name: SocialAccount.name, schema: SocialAccountSchema },
      { name: InstagramAccount.name, schema: InstagramAccountSchema },
      { name: YoutubeAccount.name, schema: YoutubeAccountSchema },
    ]),
    InstagramAuthModule,
  ],
  controllers: [AdvancedShareController],
  providers: [AdvancedShareService],
  exports: [AdvancedShareService],
})
export class AdvancedShareModule {}
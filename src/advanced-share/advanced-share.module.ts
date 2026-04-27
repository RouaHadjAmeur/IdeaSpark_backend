import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdvancedShareController } from './advanced-share.controller';
import { AdvancedShareService } from './advanced-share.service';
import { ScheduledPost, ScheduledPostSchema } from './schemas/scheduled-post.schema';
import { SocialAccount, SocialAccountSchema } from './schemas/social-account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScheduledPost.name, schema: ScheduledPostSchema },
      { name: SocialAccount.name, schema: SocialAccountSchema },
    ]),
  ],
  controllers: [AdvancedShareController],
  providers: [AdvancedShareService],
  exports: [AdvancedShareService],
})
export class AdvancedShareModule {}
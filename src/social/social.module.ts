import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { Follower, FollowerSchema } from './schemas/follower.schema';
import { UsersModule } from '../users/users.module';
import { SocialPostsModule } from '../social-posts/social-posts.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Notification, NotificationSchema } from '../collaboration/schemas/notification.schema';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Follower.name, schema: FollowerSchema },
            { name: User.name, schema: UserSchema },
            { name: Notification.name, schema: NotificationSchema }
        ]),
        UsersModule,
        SocialPostsModule,
        forwardRef(() => CollaborationModule),
    ],
    controllers: [SocialController],
    providers: [SocialService],
    exports: [SocialService],
})
export class SocialModule { }

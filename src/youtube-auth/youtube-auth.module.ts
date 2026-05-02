import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { YoutubeAuthController } from './youtube-auth.controller';
import { YoutubeAuthService } from './youtube-auth.service';
import { YoutubeAccount, YoutubeAccountSchema } from './schemas/youtube-account.schema';
import {
  YoutubeOauthSession,
  YoutubeOauthSessionSchema,
} from './schemas/youtube-oauth-session.schema';
@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: YoutubeAccount.name, schema: YoutubeAccountSchema },
      { name: YoutubeOauthSession.name, schema: YoutubeOauthSessionSchema },
    ]),
  ],
  controllers: [YoutubeAuthController],
  providers: [YoutubeAuthService],
  exports: [YoutubeAuthService],
})
export class YoutubeAuthModule {}

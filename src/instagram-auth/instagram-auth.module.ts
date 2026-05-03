import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstagramAuthController } from './instagram-auth.controller';
import { InstagramAuthService } from './instagram-auth.service';
import { TrendingAudioService } from './trending-audio.service';
import {
  InstagramAccount,
  InstagramAccountSchema,
} from './schemas/instagram-account.schema';
import {
  InstagramOauthSession,
  InstagramOauthSessionSchema,
} from './schemas/instagram-oauth-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InstagramAccount.name, schema: InstagramAccountSchema },
      { name: InstagramOauthSession.name, schema: InstagramOauthSessionSchema },
    ]),
  ],
  controllers: [InstagramAuthController],
  providers: [InstagramAuthService, TrendingAudioService],
  exports: [InstagramAuthService],
})
export class InstagramAuthModule {}

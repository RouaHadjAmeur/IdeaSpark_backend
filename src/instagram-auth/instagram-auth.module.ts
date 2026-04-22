import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstagramAuthController } from './instagram-auth.controller';
import { InstagramAuthService } from './instagram-auth.service';
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
  providers: [InstagramAuthService],
  exports: [InstagramAuthService],
})
export class InstagramAuthModule {}


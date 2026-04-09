import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { VideoGeneratorModule } from './video-generator/video-generator.module';
import { PersonaModule } from './persona/persona.module';
import { SloganModule } from './slogan-generator/slogan-generator.module';
import { BrandsModule } from './brands/brands.module';
import { PlansModule } from './plans/plans.module';
import { ContentBlocksModule } from './content-blocks/content-blocks.module';

import { VoiceCommandModule } from './voice-command/voice-command.module';
import { IAFinetuningModule } from './ia-finetuning/ia-finetuning.module';
import { InvitationModule } from './invitation/invitation.module';
import { FriendshipModule } from './friendship/friendship.module';
import { MessageModule } from './message/message.module';
import { NotifContactsModule } from './notif-contacts/notif-contacts.module';
import { CallModule } from './call/call.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/ideaspark',
      }),
    }),

    MailModule,
    AuthModule,
    UsersModule,
    VideoGeneratorModule,
    PersonaModule,
    SloganModule,
    BrandsModule,
    PlansModule,
    ContentBlocksModule,
    VoiceCommandModule,
    IAFinetuningModule,
    InvitationModule,
    FriendshipModule,
    MessageModule,
    NotifContactsModule,
    CallModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

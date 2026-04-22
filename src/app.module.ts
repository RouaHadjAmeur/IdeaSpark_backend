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
import { N8nModule } from './n8n/n8n.module';
import { TrendsModule } from './trends/trends.module';
import { SocialPostsModule } from './social-posts/social-posts.module';
import { BrandsModule } from './brands/brands.module';
import { PlansModule } from './plans/plans.module';
import { ContentBlocksModule } from './content-blocks/content-blocks.module';
import { ProductIdeaModule } from './product-idea/product-idea.module';
import { GoogleCalendarModule } from './google-calendar/google-calendar.module';
import { VoiceCommandModule } from './voice-command/voice-command.module';
import { IAScratchModule } from './IA_Scratch/ia-scratch.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { SocialModule } from './social/social.module';
import { IAFinetuningModule } from './ia-finetuning/ia-finetuning.module';
import { PlanCollaborationModule } from './plan-collaboration/plan-collaboration.module';
import { CaptionGeneratorModule } from './caption-generator/caption-generator.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PlanTemplatesModule } from './plan-templates/plan-templates.module';
import { StripeModule } from './stripe/stripe.module';
import { ChallengesModule } from './challenges/challenges.module';

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
    N8nModule,
    TrendsModule,
    MailModule,
    AuthModule,
    UsersModule,
    VideoGeneratorModule,
    PersonaModule,
    SloganModule,
    SocialPostsModule,
    BrandsModule,
    PlansModule,
    ContentBlocksModule,
    VoiceCommandModule,
    ProductIdeaModule,
    GoogleCalendarModule,
    IAScratchModule,
    CollaborationModule,
    SocialModule,
    IAFinetuningModule,
    PlanCollaborationModule,
    CaptionGeneratorModule,
    NotificationsModule,
    PlanTemplatesModule,
    StripeModule,
    ChallengesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

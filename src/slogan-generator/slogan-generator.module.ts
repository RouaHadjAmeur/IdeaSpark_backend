import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SloganAiController } from './slogan-generator.controller';
import { SloganAiService } from './slogan-generator.service';
import { Slogan, SloganSchema } from './schemas/slogan.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Slogan.name, schema: SloganSchema }]),
  ],
  controllers: [SloganAiController],
  providers: [SloganAiService],
  exports: [SloganAiService],
})
export class SloganModule { }

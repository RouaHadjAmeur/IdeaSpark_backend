import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Trend, TrendSchema } from './schemas/trend.schema';
import { TrendsService } from './trends.service';
import { TrendsController } from './trends.controller';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([{ name: Trend.name, schema: TrendSchema }]),
    ],
    controllers: [TrendsController],
    providers: [TrendsService],
    exports: [TrendsService],
})
export class TrendsModule { }

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentBlock, ContentBlockSchema } from './schemas/content-block.schema';
import { ContentBlocksService } from './content-blocks.service';
import { ContentBlocksController } from './content-blocks.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ContentBlock.name, schema: ContentBlockSchema },
        ]),
    ],
    controllers: [ContentBlocksController],
    providers: [ContentBlocksService],
    exports: [ContentBlocksService],
})
export class ContentBlocksModule { }

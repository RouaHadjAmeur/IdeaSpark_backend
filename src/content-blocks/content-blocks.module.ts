import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentBlock, ContentBlockSchema } from './schemas/content-block.schema';
import { ContentBlocksService } from './content-blocks.service';
import { ContentBlocksController } from './content-blocks.controller';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ContentBlock.name, schema: ContentBlockSchema },
        ]),
        forwardRef(() => CollaborationModule),
    ],
    controllers: [ContentBlocksController],
    providers: [ContentBlocksService],
    exports: [ContentBlocksService],
})
export class ContentBlocksModule { }

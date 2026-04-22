import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { IAFinetuningController } from './ia-finetuning.controller';
import { IAFinetuningService } from './ia-finetuning.service';
import { ProductIdea, ProductIdeaSchema } from './schemas/product-idea.schema';
import { ProductIdeaTrace, ProductIdeaTraceSchema } from './schemas/product-idea-trace.schema';
import { PromptRefinerTrace, PromptRefinerTraceSchema } from './schemas/prompt-refiner-trace.schema';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    MongooseModule.forFeature([
      { name: ProductIdea.name, schema: ProductIdeaSchema },
      { name: ProductIdeaTrace.name, schema: ProductIdeaTraceSchema },
      { name: PromptRefinerTrace.name, schema: PromptRefinerTraceSchema },
    ]),
  ],
  controllers: [IAFinetuningController],
  providers: [IAFinetuningService],
  exports: [IAFinetuningService],
})
export class IAFinetuningModule {}

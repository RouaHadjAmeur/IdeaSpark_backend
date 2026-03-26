import { Module } from '@nestjs/common';
import { IAScratchController } from './product_generator/ia-scratch.controller';
import { IAScratchService } from './product_generator/ia-scratch.service';
import { PromptRefinerController } from './prompt-refiner/prompt-refiner.controller';
import { PromptRefinerService } from './prompt-refiner/prompt-refiner.service';

@Module({
    controllers: [IAScratchController, PromptRefinerController],
    providers: [IAScratchService, PromptRefinerService],
    exports: [IAScratchService, PromptRefinerService],
})
export class IAScratchModule { }

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IAFinetuningController } from './ia-finetuning.controller';
import { IAFinetuningService } from './ia-finetuning.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  ],
  controllers: [IAFinetuningController],
  providers: [IAFinetuningService],
  exports: [IAFinetuningService],
})
export class IAFinetuningModule {}

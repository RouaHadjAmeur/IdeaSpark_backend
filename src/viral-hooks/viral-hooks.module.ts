import { Module } from '@nestjs/common';
import { ViralHooksController } from './viral-hooks.controller';
import { ViralHooksService } from './viral-hooks.service';

@Module({
  controllers: [ViralHooksController],
  providers: [ViralHooksService],
  exports: [ViralHooksService],
})
export class ViralHooksModule {}

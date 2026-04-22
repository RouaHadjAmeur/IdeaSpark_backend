import { Module } from '@nestjs/common';
import { CallGateway } from './call.gateway';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [MessageModule],
  providers: [CallGateway],
  exports: [CallGateway],
})
export class CallModule {}

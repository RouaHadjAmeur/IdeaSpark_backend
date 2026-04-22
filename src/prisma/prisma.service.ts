import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Placeholder for initialization if needed
  }

  async onModuleDestroy() {
    // Placeholder for cleanup if needed
  }
}

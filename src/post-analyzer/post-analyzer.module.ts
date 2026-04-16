import { Module } from '@nestjs/common';
import { PostAnalyzerController } from './post-analyzer.controller';
import { PostAnalyzerService } from './post-analyzer.service';

@Module({
  controllers: [PostAnalyzerController],
  providers: [PostAnalyzerService],
  exports: [PostAnalyzerService],
})
export class PostAnalyzerModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { SloganAiService } from './slogan-generator.service';

describe('SloganAiService', () => {
  let service: SloganAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SloganAiService],
    }).compile();

    service = module.get<SloganAiService>(SloganAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

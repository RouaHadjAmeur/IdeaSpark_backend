import { Test, TestingModule } from '@nestjs/testing';
import { SloganAiController } from './slogan-generator.controller';

describe('SloganAiController', () => {
  let controller: SloganAiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SloganAiController],
    }).compile();

    controller = module.get<SloganAiController>(SloganAiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

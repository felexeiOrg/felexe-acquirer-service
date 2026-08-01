import { Test, TestingModule } from '@nestjs/testing';
import { DisputeMngController } from './dispute-mng.controller';
import { DisputeMngService } from './dispute-mng.service';

describe('DisputeMngController', () => {
  let disputeMngController: DisputeMngController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DisputeMngController],
      providers: [DisputeMngService],
    }).compile();

    disputeMngController = app.get<DisputeMngController>(DisputeMngController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(disputeMngController.getHello()).toBe('Hello World!');
    });
  });
});

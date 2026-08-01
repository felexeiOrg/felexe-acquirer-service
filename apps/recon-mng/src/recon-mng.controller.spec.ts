import { Test, TestingModule } from '@nestjs/testing';
import { ReconMngController } from './recon-mng.controller';
import { ReconMngService } from './recon-mng.service';

describe('ReconMngController', () => {
  let reconMngController: ReconMngController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ReconMngController],
      providers: [ReconMngService],
    }).compile();

    reconMngController = app.get<ReconMngController>(ReconMngController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(reconMngController.getHello()).toBe('Hello World!');
    });
  });
});

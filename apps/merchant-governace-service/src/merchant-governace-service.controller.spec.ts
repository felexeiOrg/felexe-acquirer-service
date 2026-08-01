import { Test, TestingModule } from '@nestjs/testing';
import { MerchantGovernaceServiceController } from './merchant-governace-service.controller';
import { MerchantGovernaceServiceService } from './merchant-governace-service.service';

describe('MerchantGovernaceServiceController', () => {
  let merchantGovernaceServiceController: MerchantGovernaceServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MerchantGovernaceServiceController],
      providers: [MerchantGovernaceServiceService],
    }).compile();

    merchantGovernaceServiceController = app.get<MerchantGovernaceServiceController>(MerchantGovernaceServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(merchantGovernaceServiceController.getHello()).toBe('Hello World!');
    });
  });
});

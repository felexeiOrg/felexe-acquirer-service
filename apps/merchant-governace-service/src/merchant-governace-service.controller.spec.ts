import { Test, TestingModule } from '@nestjs/testing';
import { MerchantGovernaceServiceController } from './merchant-governace-service.controller';
import { MerchantGovernaceServiceService } from './merchant-governace-service.service';
import { WebsiteCrawlService } from './website-crawl.service';

describe('MerchantGovernaceServiceController', () => {
  let merchantGovernaceServiceController: MerchantGovernaceServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MerchantGovernaceServiceController],
      providers: [
        MerchantGovernaceServiceService,
        {
          provide: WebsiteCrawlService,
          useValue: { crawl: jest.fn(), getStatus: jest.fn() },
        },
      ],
    }).compile();

    merchantGovernaceServiceController =
      app.get<MerchantGovernaceServiceController>(
        MerchantGovernaceServiceController,
      );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(merchantGovernaceServiceController.getHello()).toBe('Hello World!');
    });
  });
});

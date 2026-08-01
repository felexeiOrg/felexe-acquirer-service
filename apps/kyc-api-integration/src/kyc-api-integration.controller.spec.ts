import { Test, TestingModule } from '@nestjs/testing';
import { KycApiIntegrationController } from './kyc-api-integration.controller';
import { KycApiIntegrationService } from './kyc-api-integration.service';

describe('KycApiIntegrationController', () => {
  let kycApiIntegrationController: KycApiIntegrationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [KycApiIntegrationController],
      providers: [KycApiIntegrationService],
    }).compile();

    kycApiIntegrationController = app.get<KycApiIntegrationController>(KycApiIntegrationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(kycApiIntegrationController.getHello()).toBe('Hello World!');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { KycApiIntegrationController } from './kyc-api-integration.controller';
import { KycApiIntegrationService } from './kyc-api-integration.service';

describe('KycApiIntegrationController', () => {
  let controller: KycApiIntegrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycApiIntegrationController],
      providers: [KycApiIntegrationService],
    }).compile();

    controller = module.get<KycApiIntegrationController>(KycApiIntegrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

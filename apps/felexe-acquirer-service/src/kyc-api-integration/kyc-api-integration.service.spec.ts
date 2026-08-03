import { Test, TestingModule } from '@nestjs/testing';
import { KycApiIntegrationService } from './kyc-api-integration.service';

describe('KycApiIntegrationService', () => {
  let service: KycApiIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KycApiIntegrationService],
    }).compile();

    service = module.get<KycApiIntegrationService>(KycApiIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

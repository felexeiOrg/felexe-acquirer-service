import { Test, TestingModule } from '@nestjs/testing';
import { MerchantGovernanceSvcService } from './merchant-governance-svc.service';

describe('MerchantGovernanceSvcService', () => {
  let service: MerchantGovernanceSvcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantGovernanceSvcService,
        {
          provide: 'MERCHANT_GOVERNACE_SERVICE',
          useValue: { send: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MerchantGovernanceSvcService>(
      MerchantGovernanceSvcService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

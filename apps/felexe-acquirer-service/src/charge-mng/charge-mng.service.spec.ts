import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MerchantOnboardingService } from '../merchant-onboarding/merchant-onboarding.service';
import { ChargeMngService } from './charge-mng.service';
import { MerchantCharge } from './entities/merchant-charge.entity';

describe('ChargeMngService', () => {
  let service: ChargeMngService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChargeMngService,
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
        {
          provide: MerchantOnboardingService,
          useValue: { getMerchant: jest.fn() },
        },
        {
          provide: getRepositoryToken(MerchantCharge),
          useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ChargeMngService>(ChargeMngService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

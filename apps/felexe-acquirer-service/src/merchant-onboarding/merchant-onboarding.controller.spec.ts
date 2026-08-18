import { Test, TestingModule } from '@nestjs/testing';
import { MerchantOnboardingController } from './merchant-onboarding.controller';
import { MerchantOnboardingService } from './merchant-onboarding.service';

describe('MerchantOnboardingController', () => {
  let controller: MerchantOnboardingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantOnboardingController],
      providers: [
        {
          provide: MerchantOnboardingService,
          useValue: { sendInvite: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<MerchantOnboardingController>(
      MerchantOnboardingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

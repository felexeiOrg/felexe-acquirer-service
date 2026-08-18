import { Test, TestingModule } from '@nestjs/testing';
import { MerchantOnboardingController } from './merchant-onboarding.controller';
import { MerchantOnboardingService } from './merchant-onboarding.service';

describe('MerchantOnboardingController', () => {
  let merchantOnboardingController: MerchantOnboardingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MerchantOnboardingController],
      providers: [
        {
          provide: MerchantOnboardingService,
          useValue: {
            getHello: () => 'Hello World!',
            sendInvite: jest.fn(),
            addMerchantDetails: jest.fn(),
            getMerchant: jest.fn(),
            updateMerchant: jest.fn(),
            deleteMerchant: jest.fn(),
          },
        },
      ],
    }).compile();

    merchantOnboardingController = app.get<MerchantOnboardingController>(
      MerchantOnboardingController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(merchantOnboardingController.getHello()).toBe('Hello World!');
    });
  });
});

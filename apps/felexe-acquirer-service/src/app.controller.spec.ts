import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const mockClientProxy = {
  send: jest.fn(),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: 'MERCHANT_ONBOARDING_SERVICE', useValue: mockClientProxy },
        { provide: 'MERCHANT_GOVERNACE_SERVICE', useValue: mockClientProxy },
        { provide: 'DISPUTE_MNG_SERVICE', useValue: mockClientProxy },
        { provide: 'RECON_MNG_SERVICE', useValue: mockClientProxy },
        { provide: 'MIS_REPORTS_SERVICE', useValue: mockClientProxy },
        { provide: 'KYC_API_INTEGRATION_SERVICE', useValue: mockClientProxy },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Felexe Acquirer Gateway"', () => {
      expect(appController.getHello()).toBe('Felexe Acquirer Gateway');
    });
  });
});

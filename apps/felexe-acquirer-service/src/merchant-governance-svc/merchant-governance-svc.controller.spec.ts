import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MerchantGovernanceSvcController } from './merchant-governance-svc.controller';
import { MerchantGovernanceSvcService } from './merchant-governance-svc.service';

describe('MerchantGovernanceSvcController', () => {
  let controller: MerchantGovernanceSvcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerchantGovernanceSvcController],
      providers: [
        {
          provide: MerchantGovernanceSvcService,
          useValue: {
            websiteCrawl: jest.fn(),
            getWebsiteStatus: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MerchantGovernanceSvcController>(
      MerchantGovernanceSvcController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

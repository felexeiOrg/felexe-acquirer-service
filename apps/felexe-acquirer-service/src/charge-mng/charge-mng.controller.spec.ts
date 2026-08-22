import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChargeMngController } from './charge-mng.controller';
import { ChargeMngService } from './charge-mng.service';

describe('ChargeMngController', () => {
  let controller: ChargeMngController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChargeMngController],
      providers: [
        {
          provide: ChargeMngService,
          useValue: {
            getCharge: jest.fn(),
            saveCharge: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChargeMngController>(ChargeMngController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

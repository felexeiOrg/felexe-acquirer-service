import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MerchantOnboardingModule } from '../merchant-onboarding/merchant-onboarding.module';
import { ChargeMngController } from './charge-mng.controller';
import { ChargeMngService } from './charge-mng.service';
import { MerchantChargeSlab } from './entities/merchant-charge-slab.entity';
import { MerchantCharge } from './entities/merchant-charge.entity';

@Module({
  imports: [
    AuthModule,
    MerchantOnboardingModule,
    TypeOrmModule.forFeature([MerchantCharge, MerchantChargeSlab]),
  ],
  controllers: [ChargeMngController],
  providers: [ChargeMngService],
})
export class ChargeMngModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MerchantOnboardingController } from './merchant-onboarding.controller';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [MerchantOnboardingController],
  providers: [MerchantOnboardingService],
})
export class MerchantOnboardingModule {}

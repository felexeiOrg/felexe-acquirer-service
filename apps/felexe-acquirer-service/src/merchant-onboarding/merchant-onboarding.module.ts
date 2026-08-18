import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthorizerController } from './authorizer.controller';
import { BankDetailController } from './bank-detail.controller';
import { DirectorController } from './director.controller';
import { MerchantOnboardingController } from './merchant-onboarding.controller';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'MERCHANT_ONBOARDING_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          let host = configService.get<string>(
            'MERCHANT_ONBOARDING_HOST',
            'localhost',
          );
          if (host === 'MERCHANT_ONBOARDING_HOST' || !host) {
            host = 'localhost';
          }

          return {
            transport: Transport.TCP,
            options: {
              host,
              port: configService.get<number>(
                'MERCHANT_ONBOARDING_PORT',
                3001,
              ),
            },
          };
        },
      },
    ]),
  ],
  controllers: [
    MerchantOnboardingController,
    DirectorController,
    AuthorizerController,
    BankDetailController,
  ],
  providers: [MerchantOnboardingService],
  exports: [MerchantOnboardingService],
})
export class MerchantOnboardingModule {}

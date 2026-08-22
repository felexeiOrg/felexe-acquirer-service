import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '../auth/auth.module';
import { AuthorizerController } from './authorizer.controller';
import { BankDetailController } from './bank-detail.controller';
import { DocumentsController } from './documents.controller';
import { DirectorController } from './director.controller';
import { AdminVerificationController } from './admin-verification.controller';
import { OnboardingFlowController } from './onboarding-flow.controller';
import { LocalFileStorageService } from './local-file-storage.service';
import { MerchantOnboardingController } from './merchant-onboarding.controller';
import { MerchantOnboardingService } from './merchant-onboarding.service';
import { VkycController } from './vkyc.controller';
import { VkycProviderService } from './vkyc-provider.service';
import { VkycWebhookController } from './vkyc-webhook.controller';

@Module({
  imports: [
    AuthModule,
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 3,
    }),
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
    AdminVerificationController,
    VkycController,
    VkycWebhookController,
    OnboardingFlowController,
    MerchantOnboardingController,
    DirectorController,
    AuthorizerController,
    BankDetailController,
    DocumentsController,
  ],
  providers: [
    MerchantOnboardingService,
    LocalFileStorageService,
    VkycProviderService,
  ],
  exports: [MerchantOnboardingService],
})
export class MerchantOnboardingModule {}

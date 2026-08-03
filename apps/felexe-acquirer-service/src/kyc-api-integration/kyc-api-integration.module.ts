import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KycApiIntegrationController } from './kyc-api-integration.controller';
import { KycApiIntegrationService } from './kyc-api-integration.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KYC_API_INTEGRATION_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          let host = configService.get<string>(
            'KYC_API_INTEGRATION_HOST',
            'localhost',
          );
          if (host === 'KYC_API_INTEGRATION_HOST' || !host) {
            host = 'localhost';
          }

          return {
            transport: Transport.TCP,
            options: {
              host,
              port: configService.get<number>(
                'KYC_API_INTEGRATION_PORT',
                3006,
              ),
            },
          };
        },
      },
    ]),
  ],
  controllers: [KycApiIntegrationController],
  providers: [KycApiIntegrationService],
  exports: [KycApiIntegrationService],
})
export class KycApiIntegrationModule {}

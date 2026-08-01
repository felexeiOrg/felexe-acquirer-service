import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KycApiIntegrationController } from './kyc-api-integration.controller';
import { KycApiIntegrationService } from './kyc-api-integration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [KycApiIntegrationController],
  providers: [KycApiIntegrationService],
})
export class KycApiIntegrationModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MerchantGovernaceServiceController } from './merchant-governace-service.controller';
import { MerchantGovernaceServiceService } from './merchant-governace-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [MerchantGovernaceServiceController],
  providers: [MerchantGovernaceServiceService],
})
export class MerchantGovernaceServiceModule {}

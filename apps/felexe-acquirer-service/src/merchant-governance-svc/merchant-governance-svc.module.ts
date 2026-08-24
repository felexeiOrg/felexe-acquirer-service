import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '../auth/auth.module';
import { MerchantGovernanceSvcController } from './merchant-governance-svc.controller';
import { MerchantGovernanceSvcService } from './merchant-governance-svc.service';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'MERCHANT_GOVERNACE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          let host = configService.get<string>(
            'MERCHANT_GOVERNACE_HOST',
            'localhost',
          );
          if (host === 'MERCHANT_GOVERNACE_HOST' || !host) {
            host = 'localhost';
          }

          return {
            transport: Transport.TCP,
            options: {
              host,
              port: configService.get<number>('MERCHANT_GOVERNACE_PORT', 3002),
            },
          };
        },
      },
    ]),
  ],
  controllers: [MerchantGovernanceSvcController],
  providers: [MerchantGovernanceSvcService],
})
export class MerchantGovernanceSvcModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';

function resolveHost(
  configService: ConfigService,
  key: string,
  fallback = 'localhost',
): string {
  let host = configService.get<string>(key, fallback);
  if (host === key || !host) {
    host = fallback;
  }
  return host;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ClientsModule.registerAsync([
      {
        name: 'MERCHANT_ONBOARDING_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: resolveHost(configService, 'MERCHANT_ONBOARDING_HOST'),
            port: configService.get<number>('MERCHANT_ONBOARDING_PORT', 3001),
          },
        }),
      },
      {
        name: 'MERCHANT_GOVERNACE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: resolveHost(configService, 'MERCHANT_GOVERNACE_HOST'),
            port: configService.get<number>('MERCHANT_GOVERNACE_PORT', 3002),
          },
        }),
      },
      {
        name: 'DISPUTE_MNG_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: resolveHost(configService, 'DISPUTE_MNG_HOST'),
            port: configService.get<number>('DISPUTE_MNG_PORT', 3003),
          },
        }),
      },
      {
        name: 'RECON_MNG_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: resolveHost(configService, 'RECON_MNG_HOST'),
            port: configService.get<number>('RECON_MNG_PORT', 3004),
          },
        }),
      },
      {
        name: 'MIS_REPORTS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: resolveHost(configService, 'MIS_REPORTS_HOST'),
            port: configService.get<number>('MIS_REPORTS_PORT', 3005),
          },
        }),
      },
      {
        name: 'KYC_API_INTEGRATION_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: resolveHost(configService, 'KYC_API_INTEGRATION_HOST'),
            port: configService.get<number>('KYC_API_INTEGRATION_PORT', 3006),
          },
        }),
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

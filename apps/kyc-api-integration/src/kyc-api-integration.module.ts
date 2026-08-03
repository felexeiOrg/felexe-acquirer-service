import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycAuditLog } from './entities/kyc-audit-log.entity';
import { KycApiIntegrationController } from './kyc-api-integration.controller';
import { KycApiIntegrationService } from './kyc-api-integration.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        entities: [KycAuditLog],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([KycAuditLog]),
  ],
  controllers: [KycApiIntegrationController],
  providers: [KycApiIntegrationService],
})
export class KycApiIntegrationModule {}

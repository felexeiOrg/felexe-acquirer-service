import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizerController } from './authorizer.controller';
import { AuthorizerCrudService } from './authorizer-crud.service';
import { AuditService } from './audit.service';
import { BankDetailController } from './bank-detail.controller';
import { BankDetailCrudService } from './bank-detail-crud.service';
import { DirectorController } from './director.controller';
import { DirectorCrudService } from './director-crud.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuthorizedSignatory } from './entities/authorized-signatory.entity';
import { BankDetail } from './entities/bank-detail.entity';
import { Director } from './entities/director.entity';
import { Merchant } from './entities/merchant.entity';
import { KycClientService } from './kyc-client.service';
import { MerchantContextService } from './merchant-context.service';
import { MerchantOnboardingController } from './merchant-onboarding.controller';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 3,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'root'),
        password: configService.get<string>('DB_PASSWORD', 'root123'),
        database: configService.get<string>('DB_NAME', 'felexei_acquirer'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([
      Merchant,
      Director,
      AuthorizedSignatory,
      BankDetail,
      AuditLog,
    ]),
  ],
  controllers: [
    MerchantOnboardingController,
    DirectorController,
    AuthorizerController,
    BankDetailController,
  ],
  providers: [
    MerchantOnboardingService,
    MerchantContextService,
    DirectorCrudService,
    AuthorizerCrudService,
    BankDetailCrudService,
    KycClientService,
    AuditService,
  ],
})
export class MerchantOnboardingModule {}

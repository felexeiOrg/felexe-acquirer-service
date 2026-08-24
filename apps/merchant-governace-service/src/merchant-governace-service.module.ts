import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantComplianceSnapshot } from './entities/merchant-compliance-snapshot.entity';
import { WebsiteCrawlLog } from './entities/website-crawl-log.entity';
import { MerchantGovernaceServiceController } from './merchant-governace-service.controller';
import { MerchantGovernaceServiceService } from './merchant-governace-service.service';
import { WebsiteCrawlService } from './website-crawl.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    TypeOrmModule.forFeature([WebsiteCrawlLog, MerchantComplianceSnapshot]),
  ],
  controllers: [MerchantGovernaceServiceController],
  providers: [MerchantGovernaceServiceService, WebsiteCrawlService],
})
export class MerchantGovernaceServiceModule {}

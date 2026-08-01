import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MisReportsController } from './mis-reports.controller';
import { MisReportsService } from './mis-reports.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [MisReportsController],
  providers: [MisReportsService],
})
export class MisReportsModule {}

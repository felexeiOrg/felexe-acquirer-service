import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DisputeMngController } from './dispute-mng.controller';
import { DisputeMngService } from './dispute-mng.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [DisputeMngController],
  providers: [DisputeMngService],
})
export class DisputeMngModule {}

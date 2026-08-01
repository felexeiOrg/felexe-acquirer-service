import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReconMngController } from './recon-mng.controller';
import { ReconMngService } from './recon-mng.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [ReconMngController],
  providers: [ReconMngService],
})
export class ReconMngModule {}

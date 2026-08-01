import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditLog } from './entities/audit-log.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { User } from './entities/user.entity';
import { OtpCleanupService } from './otp-cleanup.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, OtpVerification, AuditLog]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuditService, OtpCleanupService],
  exports: [AuthService],
})
export class AuthModule {}

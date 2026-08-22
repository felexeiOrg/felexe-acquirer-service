import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuthCookieService } from './auth-cookie.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditLog } from './entities/audit-log.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { OtpCleanupService } from './otp-cleanup.service';
import { TokenService } from './token.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, OtpVerification, AuditLog, RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: 'MERCHANT_ONBOARDING_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          let host = configService.get<string>(
            'MERCHANT_ONBOARDING_HOST',
            'localhost',
          );
          if (host === 'MERCHANT_ONBOARDING_HOST' || !host) {
            host = 'localhost';
          }

          return {
            transport: Transport.TCP,
            options: {
              host,
              port: configService.get<number>(
                'MERCHANT_ONBOARDING_PORT',
                3001,
              ),
            },
          };
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuditService,
    OtpCleanupService,
    TokenService,
    AuthCookieService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

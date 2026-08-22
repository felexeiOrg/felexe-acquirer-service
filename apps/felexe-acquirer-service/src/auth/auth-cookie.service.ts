import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import {
  AUTH_COOKIE_NAMES,
  AUTH_COOKIE_PATHS,
} from './constants/auth-cookie.constants';
import { AuthSessionTokens } from './interfaces/auth-session.interface';

@Injectable()
export class AuthCookieService {
  private readonly isProduction: boolean;
  private readonly verificationTokenTtlMinutes = 15;

  constructor(private readonly configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV', 'development') ===
      'production';
  }

  setAuthCookies(res: Response, session: AuthSessionTokens): void {
    const commonOptions = this.getCommonCookieOptions();

    res.cookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, session.accessToken, {
      ...commonOptions,
      path: AUTH_COOKIE_PATHS.API,
      maxAge: session.expiresIn * 1000,
    });

    res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, session.refreshToken, {
      ...commonOptions,
      path: AUTH_COOKIE_PATHS.AUTH,
      maxAge: Number(
        this.configService.get<string>('JWT_REFRESH_TTL_SECONDS', '604800'),
      ) * 1000,
    });

    this.clearVerificationTokenCookie(res);
  }

  setVerificationTokenCookie(res: Response, verificationToken: string): void {
    res.cookie(AUTH_COOKIE_NAMES.VERIFICATION_TOKEN, verificationToken, {
      ...this.getCommonCookieOptions(),
      path: AUTH_COOKIE_PATHS.AUTH,
      maxAge: this.verificationTokenTtlMinutes * 60 * 1000,
    });
  }

  clearAuthCookies(res: Response): void {
    const commonOptions = this.getCommonCookieOptions();

    res.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, {
      ...commonOptions,
      path: AUTH_COOKIE_PATHS.API,
    });

    res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, {
      ...commonOptions,
      path: AUTH_COOKIE_PATHS.AUTH,
    });

    this.clearVerificationTokenCookie(res);
  }

  clearVerificationTokenCookie(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAMES.VERIFICATION_TOKEN, {
      ...this.getCommonCookieOptions(),
      path: AUTH_COOKIE_PATHS.AUTH,
    });
  }

  private getCommonCookieOptions() {
    const secureFromEnv = this.configService.get<string>('COOKIE_SECURE');

    return {
      httpOnly: true,
      secure:
        secureFromEnv !== undefined
          ? secureFromEnv === 'true'
          : this.isProduction,
      sameSite: 'lax' as const,
    };
  }
}

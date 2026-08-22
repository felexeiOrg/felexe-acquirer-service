import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_NAMES } from './constants/auth-cookie.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthSessionTokens } from './interfaces/auth-session.interface';

type AuthFlowResult = {
  session?: AuthSessionTokens;
  verificationToken?: string;
  [key: string]: unknown;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(verifyOtpDto);
    this.applyAuthFlowCookies(res, result);

    return this.toPublicAuthResponse(result);
  }

  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const verificationToken =
      updatePasswordDto.verification_token ??
      req.cookies?.[AUTH_COOKIE_NAMES.VERIFICATION_TOKEN];

    if (!verificationToken) {
      throw new BadRequestException(
        'verification_token is required in cookie or request body',
      );
    }

    const result = await this.authService.updatePassword(
      updatePasswordDto,
      verificationToken,
    );
    this.applyAuthFlowCookies(res, result);

    return this.toPublicAuthResponse(result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[AUTH_COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshToken) {
      throw new BadRequestException('refresh_token cookie is required');
    }

    const result = await this.authService.refreshSession(refreshToken);
    this.applyAuthFlowCookies(res, result);

    return this.toPublicAuthResponse(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[AUTH_COOKIE_NAMES.REFRESH_TOKEN];
    const result = await this.authService.logout(refreshToken);
    this.authCookieService.clearAuthCookies(res);

    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  private applyAuthFlowCookies(res: Response, result: AuthFlowResult): void {
    if (result.session) {
      this.authCookieService.setAuthCookies(res, result.session);
    }

    if (result.verificationToken) {
      this.authCookieService.setVerificationTokenCookie(
        res,
        result.verificationToken,
      );
    }
  }

  private toPublicAuthResponse(result: AuthFlowResult) {
    const { session: _session, verificationToken: _verificationToken, ...rest } =
      result;

    return rest;
  }
}

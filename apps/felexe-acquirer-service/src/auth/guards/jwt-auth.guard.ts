import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AUTH_COOKIE_NAMES } from '../constants/auth-cookie.constants';
import { TokenService } from '../token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const accessToken = request.cookies?.[AUTH_COOKIE_NAMES.ACCESS_TOKEN];

    if (!accessToken) {
      throw new UnauthorizedException('Access token cookie is required');
    }

    const payload = this.tokenService.verifyAccessToken(accessToken);
    (request as Request & { user: typeof payload }).user = payload;

    return true;
  }
}

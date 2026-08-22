import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';
import { AccessTokenPayload } from '../token.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & { user?: AccessTokenPayload }
    >();

    const role = request.user?.role;

    if (!role) {
      throw new ForbiddenException('Access denied');
    }

    if (!requiredRoles.includes(role as UserRole)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

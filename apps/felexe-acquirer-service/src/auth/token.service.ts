import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import {
  AuthSessionTokens,
  toPublicUserProfile,
} from './interfaces/auth-session.interface';

export interface AccessTokenPayload {
  sub: string;
  role: string;
  mobile: string;
}

@Injectable()
export class TokenService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {
    this.accessTtlSeconds = Number(
      this.configService.get<string>('JWT_ACCESS_TTL_SECONDS', '3600'),
    );
    this.refreshTtlSeconds = Number(
      this.configService.get<string>('JWT_REFRESH_TTL_SECONDS', '604800'),
    );
  }

  async createSession(user: User): Promise<AuthSessionTokens> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSeconds,
    };
  }

  async refreshSession(refreshToken: string): Promise<{
    session: AuthSessionTokens;
    user: User;
  }> {
    const tokenRecord = await this.findValidRefreshToken(refreshToken);

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    tokenRecord.revoked_at = new Date();
    await this.refreshTokenRepository.save(tokenRecord);

    const user = await this.refreshTokenRepository.manager
      .getRepository(User)
      .findOne({ where: { id: tokenRecord.user_id } });

    if (!user || user.is_active !== 1) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const session = await this.createSession(user);

    return { session, user };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenRecord = await this.findValidRefreshToken(refreshToken);

    if (!tokenRecord) {
      return;
    }

    tokenRecord.revoked_at = new Date();
    await this.refreshTokenRepository.save(tokenRecord);
  }

  verifyAccessToken(accessToken: string): AccessTokenPayload {
    try {
      return this.jwtService.verify<AccessTokenPayload>(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  buildLoginSuccessResponse(user: User, session: AuthSessionTokens) {
    return {
      message: 'Login successful',
      token_type: 'Bearer' as const,
      expires_in: session.expiresIn,
      user: toPublicUserProfile(user),
    };
  }

  private signAccessToken(user: User): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      role: user.role,
      mobile: user.mobile,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.accessTtlSeconds,
    });
  }

  private async createRefreshToken(user: User): Promise<string> {
    const rawToken = randomBytes(48).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const expiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    const record = this.refreshTokenRepository.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked_at: null,
    });

    const savedRecord = await this.refreshTokenRepository.save(record);

    return `${savedRecord.id}.${rawToken}`;
  }

  private async findValidRefreshToken(
    refreshToken: string,
  ): Promise<RefreshToken | null> {
    const separatorIndex = refreshToken.indexOf('.');

    if (separatorIndex <= 0) {
      return null;
    }

    const tokenId = refreshToken.slice(0, separatorIndex);
    const rawToken = refreshToken.slice(separatorIndex + 1);

    if (!rawToken) {
      return null;
    }

    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: {
        id: tokenId,
        revoked_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
    });

    if (!tokenRecord) {
      return null;
    }

    const isMatch = await bcrypt.compare(rawToken, tokenRecord.token_hash);

    return isMatch ? tokenRecord : null;
  }
}

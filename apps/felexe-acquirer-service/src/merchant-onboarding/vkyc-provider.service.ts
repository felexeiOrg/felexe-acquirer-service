import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

type InitiateSessionResult = {
  sessionId: string;
  kycUrl: string;
  raw: Record<string, unknown>;
};

@Injectable()
export class VkycProviderService {
  private readonly logger = new Logger(VkycProviderService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async initiateSession(params: {
    companyId: string;
    externalUserId: string;
    personType: 'Director' | 'Authorizer';
  }): Promise<InitiateSessionResult> {
    const baseUrl = this.configService
      .get<string>('VKYC_BASE_URL', 'http://localhost:3010/api/v1')
      .replace(/\/$/, '');
    const apiKey =
      this.configService.get<string>('VKYC_API_KEY', '') ||
      this.configService.get<string>('VKYC_SECRET_KEY', '');
    const backendUrl = this.configService
      .get<string>('BACKEND_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
    const frontendUrl = this.configService
      .get<string>('FRONTEND_URL', 'http://localhost:8080')
      .replace(/\/$/, '');

    const personType =
      params.personType === 'Authorizer' ? 'authorizer' : 'director';

    const requestPayload = {
      company_id: params.companyId,
      external_user_id: params.externalUserId,
      person_type: personType,
      person_id: params.externalUserId,
      webhook_url: `${backendUrl}/v2/api/merchant-onboarding/webhooks/vkyc`,
      success_redirect_url: `${frontendUrl}/onboarding?tab=video-kyc&kyc_status=success`,
      cancel_redirect_url: `${frontendUrl}/onboarding?tab=video-kyc&kyc_status=cancel`,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}/vkyc/sessions/initiate`, requestPayload, {
          headers,
          timeout: 60000,
          validateStatus: () => true,
        }),
      );

      const data = this.asRecord(response.data) ?? {};
      if (response.status < 200 || response.status >= 300) {
        this.logger.error(
          `VKYC initiate failed (${response.status}): ${JSON.stringify(data)}`,
        );
        throw new InternalServerErrorException(
          this.asString(data.message) ?? 'VKYC session initiate failed',
        );
      }

      const nested = this.asRecord(data.data) ?? data;
      const sessionId = this.asString(
        nested.session_id ?? nested.sessionId ?? data.session_id,
      );
      const kycUrl = this.asString(
        nested.kyc_url ?? nested.kycUrl ?? nested.redirect_url ?? data.kyc_url,
      );

      if (!sessionId || !kycUrl) {
        this.logger.error(
          `VKYC initiate missing session_id/kyc_url: ${JSON.stringify(data)}`,
        );
        throw new InternalServerErrorException(
          'VKYC provider did not return session_id and kyc_url',
        );
      }

      return { sessionId, kycUrl, raw: data };
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      const axiosError = error as AxiosError;
      const code = axiosError.code ?? '';
      if (
        code === 'ECONNREFUSED' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNRESET' ||
        /ECONNREFUSED|connect/i.test(axiosError.message ?? '')
      ) {
        this.logger.error(`VKYC provider unreachable at ${baseUrl}: ${axiosError.message}`);
        throw new BadGatewayException(
          `Video KYC service is not running at ${baseUrl}. Start it on port 3010 and retry.`,
        );
      }

      this.logger.error(
        `VKYC initiate request error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new InternalServerErrorException('VKYC session initiate failed');
    }
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private asString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const text = String(value).trim();
    return text || null;
  }
}

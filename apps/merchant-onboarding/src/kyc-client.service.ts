import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KycClientService {
  private readonly logger = new Logger(KycClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async verifyGst(gstNumber: string): Promise<Record<string, unknown>> {
    return this.postKyc('verifyGST', { gstNumber });
  }

  async getCinByCompanyName(
    companyName: string,
  ): Promise<Record<string, unknown>> {
    return this.postKyc('getCINnoByCompanyName', {
      company_name: companyName,
    });
  }

  async getCompanyDetailsByCin(
    companyId: string,
  ): Promise<Record<string, unknown>> {
    return this.postKyc('getCompanyDetailsByCINno', {
      company_id: companyId,
    });
  }

  async verifyBankAccount(
    accNumber: string,
    ifscNumber: string,
  ): Promise<Record<string, unknown>> {
    return this.postKyc('verifyBankAccount', {
      acc_number: accNumber,
      ifsc_number: ifscNumber,
    });
  }

  private async postKyc(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const url = `${this.buildGatewayBaseUrl()}/kyc-api-integration/${path}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
          validateStatus: () => true,
        }),
      );

      if (response.status === 400) {
        throw new BadRequestException(
          (response.data as { message?: string | string[] })?.message ??
            `KYC ${path} validation failed`,
        );
      }

      if (response.status < 200 || response.status >= 300) {
        this.logger.error(
          `KYC ${path} failed (${response.status}): ${JSON.stringify(response.data)}`,
        );
        throw new InternalServerErrorException(`KYC ${path} request failed`);
      }

      return (response.data ?? {}) as Record<string, unknown>;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(
        `KYC ${path} unexpected error: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new InternalServerErrorException(`KYC ${path} request failed`);
    }
  }

  private buildGatewayBaseUrl(): string {
    let host = this.configService.get<string>('GATEWAY_HOST', 'localhost');
    if (host === 'GATEWAY_HOST' || !host) {
      host = 'localhost';
    }
    const port = this.configService.get<number>('GATEWAY_PORT', 3000);
    return `http://${host}:${port}/v2/api`;
  }
}

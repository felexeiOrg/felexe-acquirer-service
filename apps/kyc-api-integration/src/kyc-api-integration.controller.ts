import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { KycApiIntegrationService } from './kyc-api-integration.service';

@Controller()
export class KycApiIntegrationController {
  constructor(
    private readonly kycApiIntegrationService: KycApiIntegrationService,
  ) {}

  @MessagePattern({ cmd: 'kyc-api-integration.getHello' })
  getHello(): string {
    return this.kycApiIntegrationService.getHello();
  }
}

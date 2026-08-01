import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Controller()
export class MerchantOnboardingController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
  ) {}

  @MessagePattern({ cmd: 'merchant-onboarding.getHello' })
  getHello(): string {
    return this.merchantOnboardingService.getHello();
  }
}

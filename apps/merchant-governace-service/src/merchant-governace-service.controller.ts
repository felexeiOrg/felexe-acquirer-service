import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MerchantGovernaceServiceService } from './merchant-governace-service.service';

@Controller()
export class MerchantGovernaceServiceController {
  constructor(
    private readonly merchantGovernaceServiceService: MerchantGovernaceServiceService,
  ) {}

  @MessagePattern({ cmd: 'merchant-governace.getHello' })
  getHello(): string {
    return this.merchantGovernaceServiceService.getHello();
  }
}

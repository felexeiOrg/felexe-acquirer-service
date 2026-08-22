import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  VkycAdminListPayloadDto,
  VkycAdminReviewPayloadDto,
  VkycPersonPayloadDto,
  VkycUpdateSessionPayloadDto,
  VkycUserPayloadDto,
} from './dto/vkyc.dto';
import { VkycService } from './vkyc.service';

@Controller()
export class VkycController {
  constructor(private readonly vkycService: VkycService) {}

  @MessagePattern({ cmd: 'merchant-onboarding.vkyc.assertPerson' })
  assertPerson(@Payload() payload: VkycPersonPayloadDto) {
    return this.vkycService.assertPerson(payload);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.vkyc.updateSession' })
  updateSession(@Payload() payload: VkycUpdateSessionPayloadDto) {
    return this.vkycService.updateSession(payload);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.vkyc.applyWebhook' })
  applyWebhook(@Payload() payload: Record<string, unknown>) {
    return this.vkycService.applyWebhook(payload);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.vkyc.listByUser' })
  listByUser(@Payload() payload: VkycUserPayloadDto) {
    return this.vkycService.listByUserId(payload.userId);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.vkyc.listByClient' })
  listByClient(@Payload() payload: VkycAdminListPayloadDto) {
    return this.vkycService.listByClientId(payload.clientId, {
      includeMedia: true,
    });
  }

  @MessagePattern({ cmd: 'merchant-onboarding.vkyc.adminReview' })
  adminReview(@Payload() payload: VkycAdminReviewPayloadDto) {
    return this.vkycService.adminReview(payload);
  }
}

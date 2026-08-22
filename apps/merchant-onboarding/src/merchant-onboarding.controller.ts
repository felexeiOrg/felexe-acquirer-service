import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AddMerchantDetailsDto } from './dto/add-merchant-details.dto';
import {
  ClientIdPayloadDto,
  UpdateMerchantPayloadDto,
} from './dto/payload.dto';
import { SendInviteDto } from './dto/send-invite.dto';
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

  @MessagePattern({ cmd: 'merchant-onboarding.sendInvite' })
  sendInvite(@Payload() body: SendInviteDto) {
    return this.merchantOnboardingService.sendInvite(body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.getInvitedMerchantList' })
  getInvitedMerchantList() {
    return this.merchantOnboardingService.getInvitedMerchantList();
  }

  @MessagePattern({ cmd: 'merchant-onboarding.getOnboardedMerchantList' })
  getOnboardedMerchantList() {
    return this.merchantOnboardingService.getOnboardedMerchantList();
  }

  @MessagePattern({ cmd: 'merchant-onboarding.getCompletedMerchantList' })
  getCompletedMerchantList() {
    return this.merchantOnboardingService.getCompletedMerchantList();
  }

  @MessagePattern({ cmd: 'merchant-onboarding.invites.refreshByUserId' })
  refreshInviteProgressByUserId(@Payload() payload: { userId: string }) {
    return this.merchantOnboardingService.refreshInviteProgressByUserId(
      payload.userId,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.addMerchantDetails' })
  addMerchantDetails(@Payload() body: AddMerchantDetailsDto) {
    return this.merchantOnboardingService.addMerchantDetails(body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.getMerchant' })
  getMerchant(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingService.getMerchant(payload.clientId);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.updateMerchant' })
  updateMerchant(@Payload() payload: UpdateMerchantPayloadDto) {
    const { clientId, ...body } = payload;
    return this.merchantOnboardingService.updateMerchant(clientId, body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.deleteMerchant' })
  deleteMerchant(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingService.deleteMerchant(payload.clientId);
  }
}

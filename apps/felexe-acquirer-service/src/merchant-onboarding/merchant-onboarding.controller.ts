import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ClientIdPipe, ResourceIdPipe } from '../common/pipes/uuid-param.pipe';
import { AddMerchantDetailsDto } from './dto/add-merchant-details.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Controller('merchant-onboarding')
export class MerchantOnboardingController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
  ) {}

  @Post('sendInvite')
  async sendInvite(@Body() body: SendInviteDto) {
    return this.merchantOnboardingService.sendInvite(body);
  }

  @Post('addMerchantDetails')
  async addMerchantDetails(@Body() body: AddMerchantDetailsDto) {
    return this.merchantOnboardingService.addMerchantDetails(body);
  }

  @Get(':clientId')
  async getMerchant(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.getMerchant(clientId);
  }

  @Post(':clientId/update')
  async updateMerchant(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: UpdateMerchantDto,
  ) {
    return this.merchantOnboardingService.updateMerchant(clientId, body);
  }

  @Post(':clientId/delete')
  async deleteMerchant(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.deleteMerchant(clientId);
  }
}

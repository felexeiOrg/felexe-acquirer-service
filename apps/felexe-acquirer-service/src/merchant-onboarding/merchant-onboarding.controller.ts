import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ADMIN_ROLES } from '../auth/constants/admin-roles.constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
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

  @Get('invited-merchants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  getInvitedMerchantList() {
    return this.merchantOnboardingService.getInvitedMerchantList();
  }

  @Get('merchants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  getMerchantList() {
    return this.merchantOnboardingService.getOnboardedMerchantList();
  }

  @Get('completed-merchants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  getCompletedMerchantList() {
    return this.merchantOnboardingService.getCompletedMerchantList();
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

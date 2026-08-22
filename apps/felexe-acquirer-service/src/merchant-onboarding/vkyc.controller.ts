import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { InitiateVkycDto } from './dto/initiate-vkyc.dto';
import { MerchantOnboardingService } from './merchant-onboarding.service';
import { VkycProviderService } from './vkyc-provider.service';

@Controller('merchant-onboarding')
@UseGuards(JwtAuthGuard)
export class VkycController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
    private readonly vkycProviderService: VkycProviderService,
  ) {}

  @Post('vkyc/initiate')
  async initiate(
    @Body() body: InitiateVkycDto,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.merchantOnboardingService.assertVkycPerson({
      userId: request.user.sub,
      personId: body.personId,
      type: body.type,
    });

    const session = await this.vkycProviderService.initiateSession({
      companyId: request.user.sub,
      externalUserId: body.personId,
      personType: body.type,
    });

    await this.merchantOnboardingService.updateVkycSession({
      userId: request.user.sub,
      personId: body.personId,
      type: body.type,
      sessionId: session.sessionId,
    });

    return {
      session_id: session.sessionId,
      kyc_url: session.kycUrl,
    };
  }

  @Get('vkyc-persons')
  listVkycPersons(@Req() request: AuthenticatedRequest) {
    return this.merchantOnboardingService.listVkycPersonsByUser(
      request.user.sub,
    );
  }
}

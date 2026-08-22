import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ClientIdPipe } from '../common/pipes/uuid-param.pipe';
import { SubmitMerchantDetailsSectionDto } from './dto/submit-merchant-details-section.dto';
import { StartOnboardingDto } from './dto/start-onboarding.dto';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Controller('merchant-onboarding')
export class OnboardingFlowController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
  ) {}

  @Post('onboarding/start')
  startOnboarding(@Body() body: StartOnboardingDto) {
    return this.merchantOnboardingService.startOnboarding(body);
  }

  @Get('onboarding/status')
  getOnboardingStatusByUser(@Query('userId') userId: string) {
    return this.merchantOnboardingService.getOnboardingStatusByUser(userId);
  }

  @Get(':clientId/onboarding/status')
  getOnboardingStatusByClient(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.getOnboardingStatusByClient(clientId);
  }

  @Get(':clientId/merchant-details/form-config')
  getMerchantDetailsFormConfig(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.getMerchantDetailsFormConfig(clientId);
  }

  @Post(':clientId/sections/merchant-details/submit')
  submitMerchantDetails(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: SubmitMerchantDetailsSectionDto,
  ) {
    return this.merchantOnboardingService.submitMerchantDetailsSection(
      clientId,
      body,
    );
  }

  @Post(':clientId/sections/directors/submit')
  submitDirectors(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.submitDirectorsSection(clientId);
  }

  @Post(':clientId/sections/authorizers/submit')
  submitAuthorizers(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.submitAuthorizersSection(clientId);
  }

  @Post(':clientId/sections/bank-details/submit')
  submitBankDetails(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.submitBankDetailsSection(clientId);
  }

  @Post(':clientId/sections/video-kyc/submit')
  submitVideoKyc(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.submitVideoKycSection(clientId);
  }

  @Post(':clientId/sections/documents/submit')
  submitDocuments(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.submitDocumentsSection(clientId);
  }

  @Post(':clientId/onboarding/complete')
  completeOnboarding(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.completeOnboarding(clientId);
  }
}

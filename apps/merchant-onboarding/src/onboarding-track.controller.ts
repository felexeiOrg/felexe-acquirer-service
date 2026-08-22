import { Controller, HttpException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ClientIdPayloadDto } from './dto/payload.dto';
import { StartOnboardingDto } from './dto/start-onboarding.dto';
import { SubmitMerchantDetailsSectionDto } from './dto/submit-merchant-details-section.dto';
import { MerchantOnboardingTrackService } from './merchant-onboarding-track.service';

@Controller()
export class OnboardingTrackController {
  constructor(
    private readonly merchantOnboardingTrackService: MerchantOnboardingTrackService,
  ) {}

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.start' })
  startOnboarding(@Payload() body: StartOnboardingDto) {
    return this.merchantOnboardingTrackService.startOnboarding(body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.statusByUser' })
  getStatusByUser(@Payload() payload: { userId: string }) {
    return this.merchantOnboardingTrackService.getOnboardingStatus(
      payload.userId,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.statusByClient' })
  getStatusByClient(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingTrackService.getOnboardingStatusByClientId(
      payload.clientId,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.formConfig' })
  getFormConfig(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingTrackService.getMerchantDetailsFormConfig(
      payload.clientId,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.submitMerchantDetails' })
  submitMerchantDetails(
    @Payload()
    payload: ClientIdPayloadDto & SubmitMerchantDetailsSectionDto,
  ) {
    const { clientId, ...body } = payload;
    return this.merchantOnboardingTrackService.submitMerchantDetailsSection(
      clientId,
      body,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.submitDirectors' })
  submitDirectors(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingTrackService.submitDirectorsSection(
      payload.clientId,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.submitAuthorizers' })
  submitAuthorizers(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingTrackService.submitAuthorizersSection(
      payload.clientId,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.submitBankDetails' })
  submitBankDetails(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingTrackService.submitBankDetailsSection(
      payload.clientId,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.submitVideoKyc' })
  async submitVideoKyc(@Payload() payload: ClientIdPayloadDto) {
    try {
      return await this.merchantOnboardingTrackService.submitVideoKycSection(
        payload.clientId,
      );
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.submitDocuments' })
  submitDocuments(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingTrackService.submitDocumentsSection(
      payload.clientId,
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.onboarding.complete' })
  completeOnboarding(@Payload() payload: ClientIdPayloadDto) {
    return this.merchantOnboardingTrackService.completeOnboarding(
      payload.clientId,
    );
  }

  private toRpcException(error: unknown): RpcException {
    if (error instanceof RpcException) {
      return error;
    }

    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      if (typeof response === 'object' && response !== null) {
        return new RpcException({
          ...(response as Record<string, unknown>),
          statusCode:
            (response as { statusCode?: number }).statusCode ?? status,
        });
      }
      return new RpcException({
        statusCode: status,
        message: response,
        error: error.name,
      });
    }

    return new RpcException({
      statusCode: 500,
      message:
        error instanceof Error ? error.message : 'Video KYC submit failed',
      error: 'Internal Server Error',
    });
  }
}

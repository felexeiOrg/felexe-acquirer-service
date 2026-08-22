import { Controller, HttpException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AdminVerificationService } from './admin-verification.service';
import {
  AdminDocumentReviewPayloadDto,
  AdminOverallApprovalPayloadDto,
  AdminSectionReviewPayloadDto,
} from './dto/admin-verification.dto';
import { ClientIdPayloadDto } from './dto/payload.dto';

@Controller()
export class AdminVerificationController {
  constructor(
    private readonly adminVerificationService: AdminVerificationService,
  ) {}

  @MessagePattern({ cmd: 'merchant-onboarding.admin.pending' })
  listPending() {
    return this.wrap(() => this.adminVerificationService.listPending());
  }

  @MessagePattern({ cmd: 'merchant-onboarding.admin.review' })
  getReview(@Payload() payload: ClientIdPayloadDto) {
    return this.wrap(() =>
      this.adminVerificationService.getReview(payload.clientId),
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.admin.reviewSection' })
  reviewSection(@Payload() payload: AdminSectionReviewPayloadDto) {
    return this.wrap(() =>
      this.adminVerificationService.reviewSection(payload),
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.admin.reviewDocument' })
  reviewDocument(@Payload() payload: AdminDocumentReviewPayloadDto) {
    return this.wrap(() =>
      this.adminVerificationService.reviewDocument(payload),
    );
  }

  @MessagePattern({ cmd: 'merchant-onboarding.admin.approval' })
  submitApproval(@Payload() payload: AdminOverallApprovalPayloadDto) {
    return this.wrap(() =>
      this.adminVerificationService.submitApproval(payload),
    );
  }

  private async wrap<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.toRpcException(error);
    }
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
        error instanceof Error ? error.message : 'Admin verification failed',
      error: 'Internal Server Error',
    });
  }
}

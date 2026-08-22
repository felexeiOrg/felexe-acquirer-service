import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Controller('merchant-onboarding/webhooks')
export class VkycWebhookController {
  private readonly logger = new Logger(VkycWebhookController.name);

  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
    private readonly configService: ConfigService,
  ) {}

  @Post('vkyc')
  async handleVkycWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-signature') signature?: string,
  ) {
    this.verifySignature(body, signature);
    return this.merchantOnboardingService.applyVkycWebhook(body ?? {});
  }

  private verifySignature(
    body: Record<string, unknown>,
    signature: string | undefined,
  ) {
    const secret = this.configService.get<string>('VKYC_SECRET_KEY', '');
    if (!secret) {
      this.logger.warn('VKYC_SECRET_KEY is not set; skipping webhook HMAC check');
      return;
    }

    const payload = JSON.stringify(body ?? {});
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const incoming = String(signature ?? '')
      .trim()
      .replace(/^sha256=/i, '');

    if (!incoming) {
      this.logger.warn('VKYC webhook missing x-signature; processing anyway');
      return;
    }

    try {
      const expectedBuffer = Buffer.from(expected, 'hex');
      const incomingBuffer = Buffer.from(incoming, 'hex');
      const matches =
        expectedBuffer.length === incomingBuffer.length &&
        expectedBuffer.length > 0 &&
        timingSafeEqual(expectedBuffer, incomingBuffer);

      if (!matches) {
        this.logger.warn(
          'VKYC webhook HMAC signature mismatch; processing anyway',
        );
      }
    } catch {
      this.logger.warn(
        'VKYC webhook HMAC signature could not be compared; processing anyway',
      );
    }
  }
}

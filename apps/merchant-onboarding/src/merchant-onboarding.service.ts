import { Injectable } from '@nestjs/common';

@Injectable()
export class MerchantOnboardingService {
  getHello(): string {
    return 'Hello World!';
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class KycApiIntegrationService {
  getHello(): string {
    return 'Hello World!';
  }
}

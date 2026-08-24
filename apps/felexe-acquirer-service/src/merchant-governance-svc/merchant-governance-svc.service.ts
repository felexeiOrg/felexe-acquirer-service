import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { mapMicroserviceError } from '../common/validation/map-microservice-error';

@Injectable()
export class MerchantGovernanceSvcService {
  constructor(
    @Inject('MERCHANT_GOVERNACE_SERVICE')
    private readonly governanceClient: ClientProxy,
  ) {}

  websiteCrawl(clientId: string, websiteUrl: string) {
    return this.send('merchant-governace.websiteCrawl', {
      clientId,
      websiteUrl,
    });
  }

  getWebsiteStatus(clientId: string, includeHistory?: boolean) {
    return this.send('merchant-governace.getWebsiteStatus', {
      clientId,
      includeHistory: includeHistory === true,
    });
  }

  private send<T>(cmd: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.governanceClient.send<T>({ cmd }, body).pipe(
        catchError((err: unknown) =>
          throwError(() => mapMicroserviceError(err)),
        ),
      ),
    );
  }
}

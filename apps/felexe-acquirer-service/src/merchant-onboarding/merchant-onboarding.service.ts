import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { AddMerchantDetailsDto } from './dto/add-merchant-details.dto';
import { CreateBankDetailDto, UpdateBankDetailDto } from './dto/bank-detail.dto';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { mapMicroserviceError } from '../common/validation/map-microservice-error';

@Injectable()
export class MerchantOnboardingService {
  constructor(
    @Inject('MERCHANT_ONBOARDING_SERVICE')
    private readonly merchantOnboardingClient: ClientProxy,
  ) {}

  async sendInvite(body: SendInviteDto) {
    return this.send('merchant-onboarding.sendInvite', body);
  }

  async addMerchantDetails(body: AddMerchantDetailsDto) {
    return this.send('merchant-onboarding.addMerchantDetails', body);
  }

  async getMerchant(clientId: string) {
    return this.send('merchant-onboarding.getMerchant', { clientId });
  }

  async updateMerchant(clientId: string, body: UpdateMerchantDto) {
    return this.send('merchant-onboarding.updateMerchant', { clientId, ...body });
  }

  async deleteMerchant(clientId: string) {
    return this.send('merchant-onboarding.deleteMerchant', { clientId });
  }

  async listDirectors(clientId: string) {
    return this.send('merchant-onboarding.directors.list', { clientId });
  }

  async getDirector(clientId: string, id: string) {
    return this.send('merchant-onboarding.directors.get', { clientId, id });
  }

  async createDirector(clientId: string, body: CreatePersonDto) {
    return this.send('merchant-onboarding.directors.create', {
      clientId,
      ...body,
    });
  }

  async updateDirector(clientId: string, id: string, body: UpdatePersonDto) {
    return this.send('merchant-onboarding.directors.update', {
      clientId,
      id,
      ...body,
    });
  }

  async deleteDirector(clientId: string, id: string) {
    return this.send('merchant-onboarding.directors.delete', { clientId, id });
  }

  async listAuthorizers(clientId: string) {
    return this.send('merchant-onboarding.authorizers.list', { clientId });
  }

  async getAuthorizer(clientId: string, id: string) {
    return this.send('merchant-onboarding.authorizers.get', { clientId, id });
  }

  async createAuthorizer(clientId: string, body: CreatePersonDto) {
    return this.send('merchant-onboarding.authorizers.create', {
      clientId,
      ...body,
    });
  }

  async updateAuthorizer(clientId: string, id: string, body: UpdatePersonDto) {
    return this.send('merchant-onboarding.authorizers.update', {
      clientId,
      id,
      ...body,
    });
  }

  async deleteAuthorizer(clientId: string, id: string) {
    return this.send('merchant-onboarding.authorizers.delete', { clientId, id });
  }

  async listBankDetails(clientId: string) {
    return this.send('merchant-onboarding.bankDetails.list', { clientId });
  }

  async getBankDetail(clientId: string, id: string) {
    return this.send('merchant-onboarding.bankDetails.get', { clientId, id });
  }

  async createBankDetail(clientId: string, body: CreateBankDetailDto) {
    return this.send('merchant-onboarding.bankDetails.create', {
      clientId,
      ...body,
    });
  }

  async updateBankDetail(
    clientId: string,
    id: string,
    body: UpdateBankDetailDto,
  ) {
    return this.send('merchant-onboarding.bankDetails.update', {
      clientId,
      id,
      ...body,
    });
  }

  async deleteBankDetail(clientId: string, id: string) {
    return this.send('merchant-onboarding.bankDetails.delete', { clientId, id });
  }

  private send<T>(cmd: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.merchantOnboardingClient.send<T>({ cmd }, body).pipe(
        catchError((err: unknown) =>
          throwError(() => mapMicroserviceError(err)),
        ),
      ),
    );
  }
}

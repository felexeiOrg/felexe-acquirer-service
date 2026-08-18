import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { mapMicroserviceError } from '../common/validation/map-microservice-error';
import { DinValidationDto } from './dto/din-validation.dto';
import { FssaiValidationDto } from './dto/fssai-validation.dto';
import { GetAadhaarVerificationStatusDto } from './dto/get-aadhaar-verification-status.dto';
import { GetCINnoByCompanyNameDto } from './dto/get-cin-by-company-name.dto';
import { GetCompanyDetailsByCINnoDto } from './dto/get-company-details-by-cin.dto';
import { InitiateAadhaarDigilockerDto } from './dto/initiate-aadhaar-digilocker.dto';
import { ShopEstablishmentValidationDto } from './dto/shop-establishment-validation.dto';
import { UdyamVerificationDto } from './dto/udyam-verification.dto';
import { VerifyBankAccountDto } from './dto/verify-bank-account.dto';
import { VerifyGSTDto } from './dto/verify-gst.dto';
import { VerifyPanDto } from './dto/verify-pan.dto';

@Injectable()
export class KycApiIntegrationService {
  constructor(
    @Inject('KYC_API_INTEGRATION_SERVICE')
    private readonly kycClient: ClientProxy,
  ) {}

  async verifyPan(body: VerifyPanDto) {
    return this.send('kyc-api-integration.verifyPan', body);
  }

  async initiateAdharVerificationViaDigilocker(
    body: InitiateAadhaarDigilockerDto,
  ) {
    return this.send(
      'kyc-api-integration.initiateAdharVerificationViaDigilocker',
      body,
    );
  }

  async getAdharVerificationStatus(body: GetAadhaarVerificationStatusDto) {
    return this.send('kyc-api-integration.getAdharVerificationStatus', body);
  }

  async udyamVerification(body: UdyamVerificationDto) {
    return this.send('kyc-api-integration.udyamVerification', body);
  }

  async fssaiValidation(body: FssaiValidationDto) {
    return this.send('kyc-api-integration.fssaiValidation', body);
  }

  async shopEstablishmentValidation(body: ShopEstablishmentValidationDto) {
    return this.send('kyc-api-integration.shopEstablishmentValidation', body);
  }

  async getCINnoByCompanyName(body: GetCINnoByCompanyNameDto) {
    return this.send('kyc-api-integration.getCINnoByCompanyName', body);
  }

  async getCompanyDetailsByCINno(body: GetCompanyDetailsByCINnoDto) {
    return this.send('kyc-api-integration.getCompanyDetailsByCINno', body);
  }

  async dinValidation(body: DinValidationDto) {
    return this.send('kyc-api-integration.dinValidation', body);
  }

  async verifyGST(body: VerifyGSTDto) {
    return this.send('kyc-api-integration.verifyGST', body);
  }

  async verifyBankAccount(body: VerifyBankAccountDto) {
    return this.send('kyc-api-integration.verifyBankAccount', body);
  }

  private send<T>(cmd: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.kycClient.send<T>({ cmd }, body).pipe(
        catchError((err: unknown) =>
          throwError(() => mapMicroserviceError(err)),
        ),
      ),
    );
  }
}

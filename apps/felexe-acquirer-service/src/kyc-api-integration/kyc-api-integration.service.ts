import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
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
    return firstValueFrom(
      this.kycClient.send({ cmd: 'kyc-api-integration.verifyPan' }, body),
    );
  }

  async initiateAdharVerificationViaDigilocker(
    body: InitiateAadhaarDigilockerDto,
  ) {
    return firstValueFrom(
      this.kycClient.send(
        { cmd: 'kyc-api-integration.initiateAdharVerificationViaDigilocker' },
        body,
      ),
    );
  }

  async getAdharVerificationStatus(body: GetAadhaarVerificationStatusDto) {
    return firstValueFrom(
      this.kycClient.send(
        { cmd: 'kyc-api-integration.getAdharVerificationStatus' },
        body,
      ),
    );
  }

  async udyamVerification(body: UdyamVerificationDto) {
    return firstValueFrom(
      this.kycClient.send(
        { cmd: 'kyc-api-integration.udyamVerification' },
        body,
      ),
    );
  }

  async fssaiValidation(body: FssaiValidationDto) {
    return firstValueFrom(
      this.kycClient.send(
        { cmd: 'kyc-api-integration.fssaiValidation' },
        body,
      ),
    );
  }

  async shopEstablishmentValidation(body: ShopEstablishmentValidationDto) {
    return firstValueFrom(
      this.kycClient.send(
        { cmd: 'kyc-api-integration.shopEstablishmentValidation' },
        body,
      ),
    );
  }

  async getCINnoByCompanyName(body: GetCINnoByCompanyNameDto) {
    return firstValueFrom(
      this.kycClient.send(
        { cmd: 'kyc-api-integration.getCINnoByCompanyName' },
        body,
      ),
    );
  }

  async getCompanyDetailsByCINno(body: GetCompanyDetailsByCINnoDto) {
    return firstValueFrom(
      this.kycClient.send(
        { cmd: 'kyc-api-integration.getCompanyDetailsByCINno' },
        body,
      ),
    );
  }

  async dinValidation(body: DinValidationDto) {
    return firstValueFrom(
      this.kycClient.send({ cmd: 'kyc-api-integration.dinValidation' }, body),
    );
  }

  async verifyGST(body: VerifyGSTDto) {
    return firstValueFrom(
      this.kycClient.send({ cmd: 'kyc-api-integration.verifyGST' }, body),
    );
  }

  async verifyBankAccount(body: VerifyBankAccountDto) {
    return firstValueFrom(
      this.kycClient.send(
        { cmd: 'kyc-api-integration.verifyBankAccount' },
        body,
      ),
    );
  }
}

import { Body, Controller, Post } from '@nestjs/common';
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
import { KycApiIntegrationService } from './kyc-api-integration.service';

@Controller('kyc-api-integration')
export class KycApiIntegrationController {
  constructor(
    private readonly kycApiIntegrationService: KycApiIntegrationService,
  ) {}


  //PAN VERIFICATION
  @Post('verifyPan')
  async verifyPan(@Body() body: VerifyPanDto) {
    return this.kycApiIntegrationService.verifyPan(body);
  }

  //AADHAAR VERIFICATION

  @Post('initiateAdharVerificationViaDigilocker')
  async initiateAdharVerificationViaDigilocker(
    @Body() body: InitiateAadhaarDigilockerDto,
  ) {
    return this.kycApiIntegrationService.initiateAdharVerificationViaDigilocker(
      body,
    );
  }

  @Post('getAdharVerificationStatus')
  async getAdharVerificationStatus(
    @Body() body: GetAadhaarVerificationStatusDto,
  ) {
    return this.kycApiIntegrationService.getAdharVerificationStatus(body);
  }

  //MSME VERIFICATION

  @Post('udyam-verification')
  async udyamVerification(@Body() body: UdyamVerificationDto) {
    return this.kycApiIntegrationService.udyamVerification(body);
  }

  @Post('fssaiValidation')
  async fssaiValidation(@Body() body: FssaiValidationDto) {
    return this.kycApiIntegrationService.fssaiValidation(body);
  }

  @Post('shopEstablishmentValidation')
  async shopEstablishmentValidation(
    @Body() body: ShopEstablishmentValidationDto,
  ) {
    return this.kycApiIntegrationService.shopEstablishmentValidation(body);
  }

  //COMPANY VERIFICATION

  @Post('getCINnoByCompanyName')
  async getCINnoByCompanyName(@Body() body: GetCINnoByCompanyNameDto) {
    return this.kycApiIntegrationService.getCINnoByCompanyName(body);
  }

  @Post('getCompanyDetailsByCINno')
  async getCompanyDetailsByCINno(@Body() body: GetCompanyDetailsByCINnoDto) {
    return this.kycApiIntegrationService.getCompanyDetailsByCINno(body);
  }

  @Post('dinValidation')
  async dinValidation(@Body() body: DinValidationDto) {
    return this.kycApiIntegrationService.dinValidation(body);
  }

  @Post('verifyGST')
  async verifyGST(@Body() body: VerifyGSTDto) {
    return this.kycApiIntegrationService.verifyGST(body);
  }

  // BANK ACCOUNT VERIFICATION

  @Post('verifyBankAccount')
  async verifyBankAccount(@Body() body: VerifyBankAccountDto) {
    return this.kycApiIntegrationService.verifyBankAccount(body);
  }
}

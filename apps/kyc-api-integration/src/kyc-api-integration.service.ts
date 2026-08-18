import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
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
import { KycAuditLog } from './entities/kyc-audit-log.entity';
import {
  RPACPC_CONSENT,
  RPACPC_CONSENT_TEXT,
} from './constants/rpacpc.constants';
import { badRequestForField } from './common/validation/field-error.util';
@Injectable()
export class KycApiIntegrationService {
  private readonly logger = new Logger(KycApiIntegrationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(KycAuditLog)
    private readonly kycAuditLogRepository: Repository<KycAuditLog>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Wrapper: frontend sends { pan }, microservice builds RPACPC body:
   * { user_id: pan, consent: "Y", consent_text: "..." }
   */
  async verifyPan(body: VerifyPanDto | Record<string, unknown>) {
    const pan = String(
      (body as VerifyPanDto).pan ?? (body as Record<string, unknown>).user_id ?? '',
    )
      .trim()
      .toUpperCase();

    if (!pan) {
      throw badRequestForField('pan', 'pan is required');
    }

    // Generated vendor payload (frontend never sends this)
    const requestPayload = {
      user_id: pan,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
    };

    return this.callRpacpc({
      servicePath: '/services/id019',
      event: 'PAN_VERIFY',
      action: 'VERIFY',
      resource: 'pan',
      description: `PAN verification for ${pan}`,
      pan,
      aadhaar: null,
      requestPayload,
      failureMessage: 'PAN verification request failed',
    });
  }

  async initiateAdharVerificationViaDigilocker(
    body: InitiateAadhaarDigilockerDto | Record<string, unknown>,
  ) {
    const payload = body as Record<string, unknown>;
    const aadhaar = String(payload.aadhaar ?? payload.aadhaar_no ?? '')
      .trim()
      .replace(/\s/g, '');

    if (!/^\d{12}$/.test(aadhaar)) {
      throw badRequestForField('aadhaar', 'aadhaar must be exactly 12 digits');
    }

    const requestId = `REQ${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      action: 'redirectUrl',
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
    };

    return this.callRpacpc({
      servicePath: '/services/id018',
      event: 'AADHAAR_DIGILOCKER_INITIATE',
      action: 'INITIATE',
      resource: 'aadhaar',
      description: `Aadhaar DigiLocker initiate for request_id ${requestId}`,
      pan: null,
      aadhaar,
      requestPayload,
      failureMessage: 'Aadhaar DigiLocker initiate request failed',
    });
  }

  async getAdharVerificationStatus(
    body: GetAadhaarVerificationStatusDto | Record<string, unknown>,
  ) {
    const payload = body as Record<string, unknown>;
    const requestId = String(payload.request_id ?? '').trim();
    const verificationId = String(payload.verification_id ?? '').trim();

    if (!requestId) {
      throw badRequestForField('request_id', 'request_id is required');
    }
    if (!verificationId) {
      throw badRequestForField('verification_id', 'verification_id is required');
    }

    const requestPayload = {
      request_id: requestId,
      action: 'verification',
      verification_id: verificationId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
    };

    return this.callRpacpc({
      servicePath: '/services/id018',
      event: 'AADHAAR_DIGILOCKER_STATUS',
      action: 'STATUS',
      resource: 'aadhaar',
      description: `Aadhaar DigiLocker status for request_id ${requestId}`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'Aadhaar DigiLocker status request failed',
    });
  }

  /**
   * Wrapper: frontend sends { udyam_number }, microservice builds RPACPC body:
   * { request_id, consent, consent_text, udyam_number, is_printable: true }
   */
  async udyamVerification(
    body: UdyamVerificationDto | Record<string, unknown>,
  ) {
    const udyamNumber = String(
      (body as UdyamVerificationDto).udyam_number ??
        (body as Record<string, unknown>).udyam_number ??
        '',
    ).trim();

    if (!udyamNumber) {
      throw badRequestForField('udyam_number', 'udyam_number is required');
    }

    const requestId = `${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
      udyam_number: udyamNumber,
      is_printable: true,
    };

    return this.callRpacpc({
      servicePath: '/services/bv007',
      event: 'UDYAM_VERIFY',
      action: 'VERIFY',
      resource: 'udyam',
      description: `Udyam verification for ${udyamNumber}`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'Udyam verification request failed',
    });
  }

  /**
   * Wrapper: frontend sends { flrs_license_no }, microservice builds RPACPC body:
   * { request_id, consent, consent_text, flrs_license_no, get_all: true }
   */
  async fssaiValidation(body: FssaiValidationDto | Record<string, unknown>) {
    const licenseNo = String(
      (body as FssaiValidationDto).flrs_license_no ??
        (body as Record<string, unknown>).flrs_license_no ??
        '',
    ).trim();

    if (!licenseNo) {
      throw badRequestForField('flrs_license_no', 'flrs_license_no is required');
    }

    const requestId = `${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
      flrs_license_no: licenseNo,
      get_all: true,
    };

    return this.callRpacpc({
      servicePath: '/services/bv002',
      event: 'FSSAI_VALIDATE',
      action: 'VERIFY',
      resource: 'fssai',
      description: `FSSAI validation for ${licenseNo}`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'FSSAI validation request failed',
    });
  }

  /**
   * Wrapper: frontend sends { registration_number, state }, microservice builds RPACPC body:
   * { request_id, consent, consent_text, registration_number, state, pdf_required: false }
   */
  async shopEstablishmentValidation(
    body: ShopEstablishmentValidationDto | Record<string, unknown>,
  ) {
    const registrationNumber = String(
      (body as ShopEstablishmentValidationDto).registration_number ??
        (body as Record<string, unknown>).registration_number ??
        '',
    ).trim();
    const state = String(
      (body as ShopEstablishmentValidationDto).state ??
        (body as Record<string, unknown>).state ??
        '',
    ).trim();

    if (!registrationNumber) {
      throw badRequestForField('registration_number', 'registration_number is required');
    }
    if (!state) {
      throw badRequestForField('state', 'state is required');
    }

    const requestId = `${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
      registration_number: registrationNumber,
      state,
      pdf_required: false,
    };

    return this.callRpacpc({
      servicePath: '/services/bv036',
      event: 'SHOP_ESTABLISHMENT_VALIDATE',
      action: 'VERIFY',
      resource: 'shop_establishment',
      description: `Shop Establishment validation for ${registrationNumber} (${state})`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'Shop Establishment validation request failed',
    });
  }

  /**
   * Wrapper: frontend sends { company_name }, microservice builds RPACPC body:
   * { request_id, consent, consent_text, company_name }
   */
  async getCINnoByCompanyName(
    body: GetCINnoByCompanyNameDto | Record<string, unknown>,
  ) {
    const companyName = String(
      (body as GetCINnoByCompanyNameDto).company_name ??
        (body as Record<string, unknown>).company_name ??
        '',
    ).trim();

    if (!companyName) {
      throw badRequestForField('company_name', 'company_name is required');
    }

    const requestId = `${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
      company_name: companyName,
    };

    return this.callRpacpc({
      servicePath: '/services/bv015',
      event: 'CIN_BY_COMPANY_NAME',
      action: 'VERIFY',
      resource: 'cin',
      description: `CIN lookup by company name: ${companyName}`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'CIN lookup by company name request failed',
    });
  }

  /**
   * Wrapper: frontend sends { company_id }, microservice builds RPACPC body:
   * { request_id, consent, consent_text, company_id }
   */
  async getCompanyDetailsByCINno(
    body: GetCompanyDetailsByCINnoDto | Record<string, unknown>,
  ) {
    const companyId = String(
      (body as GetCompanyDetailsByCINnoDto).company_id ??
        (body as Record<string, unknown>).company_id ??
        '',
    ).trim();

    if (!companyId) {
      throw badRequestForField('company_id', 'company_id is required');
    }

    const requestId = `${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
      company_id: companyId,
    };

    return this.callRpacpc({
      servicePath: '/services/bv019',
      event: 'COMPANY_DETAILS_BY_CIN',
      action: 'VERIFY',
      resource: 'company',
      description: `Company details lookup for CIN: ${companyId}`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'Company details by CIN request failed',
    });
  }

  /**
   * Wrapper: frontend sends { din_number }, microservice builds RPACPC body:
   * { request_id, consent, consent_text, din_number }
   */
  async dinValidation(body: DinValidationDto | Record<string, unknown>) {
    const dinNumber = String(
      (body as DinValidationDto).din_number ??
        (body as Record<string, unknown>).din_number ??
        '',
    ).trim();

    if (!dinNumber) {
      throw badRequestForField('din_number', 'din_number is required');
    }

    const requestId = `${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
      din_number: dinNumber,
    };

    return this.callRpacpc({
      servicePath: '/services/bv025',
      event: 'DIN_VALIDATE',
      action: 'VERIFY',
      resource: 'din',
      description: `DIN validation for ${dinNumber}`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'DIN validation request failed',
    });
  }

  /**
   * Wrapper: frontend sends { gstNumber }, microservice builds RPACPC body:
   * { request_id, consent, consent_text, gstNumber, hsnDetails, branchDetails,
   *   filingDetails, filingFrequency, liabilityPaidDetails }
   */
  async verifyGST(body: VerifyGSTDto | Record<string, unknown>) {
    const gstNumber = String(
      (body as VerifyGSTDto).gstNumber ??
        (body as Record<string, unknown>).gstNumber ??
        '',
    ).trim();

    if (!gstNumber) {
      throw badRequestForField('gstNumber', 'gstNumber is required');
    }

    const requestId = `${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
      gstNumber,
      hsnDetails: true,
      branchDetails: true,
      filingDetails: true,
      filingFrequency: true,
      liabilityPaidDetails: true,
    };

    return this.callRpacpc({
      servicePath: '/services/bv010',
      event: 'GST_VERIFY',
      action: 'VERIFY',
      resource: 'gst',
      description: `GST verification for ${gstNumber}`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'GST verification request failed',
    });
  }

  /**
   * Wrapper: frontend sends { acc_number, ifsc_number }, microservice builds RPACPC body:
   * { request_id, consent, consent_text, acc_number, ifsc_number }
   */
  async verifyBankAccount(
    body: VerifyBankAccountDto | Record<string, unknown>,
  ) {
    const accNumber = String(
      (body as VerifyBankAccountDto).acc_number ??
        (body as Record<string, unknown>).acc_number ??
        '',
    ).trim();
    const ifscNumber = String(
      (body as VerifyBankAccountDto).ifsc_number ??
        (body as Record<string, unknown>).ifsc_number ??
        '',
    ).trim();

    if (!accNumber) {
      throw badRequestForField('acc_number', 'acc_number is required');
    }
    if (!ifscNumber) {
      throw badRequestForField('ifsc_number', 'ifsc_number is required');
    }

    const requestId = `${Date.now()}`;
    const requestPayload = {
      request_id: requestId,
      consent: RPACPC_CONSENT,
      consent_text: RPACPC_CONSENT_TEXT,
      acc_number: accNumber,
      ifsc_number: ifscNumber,
    };

    return this.callRpacpc({
      servicePath: '/services/fs006',
      event: 'BANK_ACCOUNT_VERIFY',
      action: 'VERIFY',
      resource: 'bank_account',
      description: `Bank account verification for ${accNumber}`,
      pan: null,
      aadhaar: null,
      requestPayload,
      failureMessage: 'Bank account verification request failed',
    });
  }

  private async callRpacpc(params: {
    servicePath: string;
    event: string;
    action: string;
    resource: string;
    description: string;
    pan: string | null;
    aadhaar: string | null;
    requestPayload: Record<string, unknown>;
    failureMessage: string;
  }) {
    const baseUrl = this.configService.getOrThrow<string>('RPACPC_URL');
    const token = this.configService.getOrThrow<string>('RPACPC_TOKEN');
    const secretKey = this.configService.getOrThrow<string>(
      'RPACPC_SECREATE_KEY',
    );
    const url = `${baseUrl.replace(/\/$/, '')}${params.servicePath}`;

    let responseBody: Record<string, unknown> | null = null;
    let httpStatus: string | null = null;
    let errorMessage: string | null = null;
    let auditStatus = 'FAILED';

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, params.requestPayload, {
          headers: {
            'Content-Type': 'application/json',
            token,
            secretkey: secretKey,
          },
          timeout: 30000,
          validateStatus: () => true,
        }),
      );

      httpStatus = String(response.status);
      responseBody =
        typeof response.data === 'object' && response.data !== null
          ? (response.data as Record<string, unknown>)
          : { raw: response.data };

      const vendorStatus = String(responseBody.status ?? '').toUpperCase();
      auditStatus =
        response.status >= 200 &&
        response.status < 300 &&
        (vendorStatus === 'SUCCESS' || vendorStatus === '')
          ? 'SUCCESS'
          : 'FAILED';

      if (auditStatus === 'FAILED') {
        errorMessage = String(
          responseBody.error ??
            responseBody.message ??
            params.failureMessage,
        );
      }

      await this.saveKycAuditLog({
        event: params.event,
        action: params.action,
        resource: params.resource,
        status: auditStatus,
        description: params.description,
        pan: params.pan,
        aadhaar: params.aadhaar,
        request: params.requestPayload,
        response: responseBody,
        statusCode: String(responseBody.status_code ?? httpStatus),
        vendorRequestId: this.asString(responseBody.request_id),
        sequenceId: this.asString(responseBody.sequence_id),
        error: errorMessage,
      });

      return responseBody;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : 'Unexpected KYC API error';
      this.logger.error(`${params.description} failed: ${errorMessage}`);

      await this.saveKycAuditLog({
        event: params.event,
        action: params.action,
        resource: params.resource,
        status: 'FAILED',
        description: `${params.description} failed`,
        pan: params.pan,
        aadhaar: params.aadhaar,
        request: params.requestPayload,
        response: responseBody,
        statusCode: httpStatus,
        vendorRequestId: null,
        sequenceId: null,
        error: errorMessage,
      });

      throw new InternalServerErrorException(params.failureMessage);
    }
  }

  private async saveKycAuditLog(params: {
    event: string;
    action: string;
    resource: string;
    status: string;
    description: string;
    pan: string | null;
    aadhaar: string | null;
    request: Record<string, unknown>;
    response: Record<string, unknown> | null;
    statusCode: string | null;
    vendorRequestId: string | null;
    sequenceId: string | null;
    error: string | null;
  }) {
    const log = this.kycAuditLogRepository.create({
      event: params.event,
      action: params.action,
      module: 'kyc',
      resource: params.resource,
      status: params.status,
      description: params.description,
      pan: params.pan,
      aadhaar: params.aadhaar,
      request: params.request,
      response: params.response,
      status_code: params.statusCode,
      vendor_request_id: params.vendorRequestId,
      sequence_id: params.sequenceId,
      error: params.error,
      event_time: new Date(),
    });

    return this.kycAuditLogRepository.save(log);
  }

  private asString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    return String(value);
  }
}

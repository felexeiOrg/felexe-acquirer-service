import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { badRequestForField } from './common/validation/field-error.util';
import { MerchantAuditEvent } from './constants/audit-event.constants';
import { OnboardingSectionKey } from './constants/onboarding-section.constants';
import { MERCHANT_ROLE } from './constants/user-role.constants';
import { isSectionSubmitted } from './merchant-onboarding-form.service';
import { AddMerchantDetailsDto } from './dto/add-merchant-details.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { StartOnboardingDto } from './dto/start-onboarding.dto';
import { SubmitMerchantDetailsSectionDto } from './dto/submit-merchant-details-section.dto';
import {
  UpdateMerchantDto,
  UpdatePersonDto,
} from './dto/update-merchant.dto';
import { AuthorizedSignatory } from './entities/authorized-signatory.entity';
import { BankDetail } from './entities/bank-detail.entity';
import { Director } from './entities/director.entity';
import { Merchant } from './entities/merchant.entity';
import { MerchantInvite } from './entities/merchant-invite.entity';
import { KycClientService } from './kyc-client.service';
import { MerchantInviteService } from './merchant-invite.service';
import { MerchantOnboardingTrackService } from './merchant-onboarding-track.service';
import {
  asRecord,
  asString,
  buildMerchantProfile,
  extractPanFromGstin,
  MerchantProfileDirector,
  selectCinMatch,
  unwrapCompanyPayload,
} from './mappers/merchant-profile.mapper';
import { toBankDetailResponse } from './mappers/bank-detail.mapper';

@Injectable()
export class MerchantOnboardingService {
  private readonly logger = new Logger(MerchantOnboardingService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly kycClientService: KycClientService,
    private readonly auditService: AuditService,
    private readonly merchantInviteService: MerchantInviteService,
    private readonly merchantOnboardingTrackService: MerchantOnboardingTrackService,
    private readonly dataSource: DataSource,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(AuthorizedSignatory)
    private readonly authorizedSignatoryRepository: Repository<AuthorizedSignatory>,
    @InjectRepository(BankDetail)
    private readonly bankDetailRepository: Repository<BankDetail>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  getInvitedMerchantList() {
    return this.merchantInviteService.listInvitedMerchants();
  }

  getOnboardedMerchantList() {
    return this.merchantInviteService.listOnboardedMerchants();
  }

  getCompletedMerchantList() {
    return this.merchantInviteService.listCompletedMerchants();
  }

  refreshInviteProgressByUserId(userId: string) {
    return this.merchantInviteService.refreshProgressByUserId(userId);
  }

  startOnboarding(body: StartOnboardingDto) {
    return this.merchantOnboardingTrackService.startOnboarding(body);
  }

  getOnboardingStatusByUser(userId: string) {
    return this.merchantOnboardingTrackService.getOnboardingStatus(userId);
  }

  getOnboardingStatusByClient(clientId: string) {
    return this.merchantOnboardingTrackService.getOnboardingStatusByClientId(
      clientId,
    );
  }

  getMerchantDetailsFormConfig(clientId: string) {
    return this.merchantOnboardingTrackService.getMerchantDetailsFormConfig(
      clientId,
    );
  }

  submitMerchantDetailsSection(
    clientId: string,
    body: SubmitMerchantDetailsSectionDto,
  ) {
    return this.merchantOnboardingTrackService.submitMerchantDetailsSection(
      clientId,
      body,
    );
  }

  submitDirectorsSection(clientId: string) {
    return this.merchantOnboardingTrackService.submitDirectorsSection(clientId);
  }

  submitAuthorizersSection(clientId: string) {
    return this.merchantOnboardingTrackService.submitAuthorizersSection(
      clientId,
    );
  }

  submitBankDetailsSection(clientId: string) {
    return this.merchantOnboardingTrackService.submitBankDetailsSection(
      clientId,
    );
  }

  submitVideoKycSection(clientId: string) {
    return this.merchantOnboardingTrackService.submitVideoKycSection(clientId);
  }

  submitDocumentsSection(clientId: string) {
    return this.merchantOnboardingTrackService.submitDocumentsSection(clientId);
  }

  completeOnboarding(clientId: string) {
    return this.merchantOnboardingTrackService.completeOnboarding(clientId);
  }

  /**
   * Creates merchant login credentials by calling gateway auth/register.
   * Password is system-generated; login is via mobile + temp password.
   */
  async sendInvite(body: SendInviteDto) {
    const email = body.email.toLowerCase().trim();
    const mobile = body.mobile.trim();

    try {
      if (!mobile || !/^\d{10}$/.test(mobile)) {
        throw badRequestForField('mobile', 'mobile must be exactly 10 digits');
      }
      if (!email) {
        throw badRequestForField('email', 'email is required');
      }

      const existingMerchantUser = await this.findMerchantUserByMobileOrEmail(
        mobile,
        email,
      );

      if (existingMerchantUser) {
        await this.merchantInviteService.ensureInviteForUser({
          userId: existingMerchantUser.id,
          company_name: body.company_name,
          first_name: body.first_name,
          last_name: body.last_name,
          mobile,
          email,
          business_website: body.business_website ?? null,
          company_type: body.company_type ?? null,
        });

        return {
          message: 'Merchant invite already exists for this mobile or email',
          login_mobile: existingMerchantUser.mobile,
          user: {
            id: existingMerchantUser.id,
            company_name: existingMerchantUser.company_name,
            first_name: existingMerchantUser.first_name,
            last_name: existingMerchantUser.last_name,
            mobile: existingMerchantUser.mobile,
            email: existingMerchantUser.email,
            role: existingMerchantUser.role,
            is_active: existingMerchantUser.is_active,
            must_change_password: existingMerchantUser.must_change_password,
            created_at: existingMerchantUser.created_at,
          },
        };
      }

      await this.assertMobileAndEmailAvailable(mobile, email);

      const registerUrl = this.buildAuthRegisterUrl();
      const registerPayload = {
        company_name: body.company_name,
        first_name: body.first_name,
        last_name: body.last_name,
        mobile,
        email,
        business_website: body.business_website,
        company_type: body.company_type,
        role: MERCHANT_ROLE,
      };

      const response = await firstValueFrom(
        this.httpService.post(registerUrl, registerPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
          validateStatus: () => true,
        }),
      );

      if (response.status === 409) {
        throw this.conflictFromRegister(mobile, email, response.data);
      }

      if (response.status === 400) {
        throw new BadRequestException(
          (response.data as { message?: string | string[] })?.message ??
            'Invalid merchant invite payload',
        );
      }

      if (response.status < 200 || response.status >= 300) {
        this.logger.error(
          `auth/register failed (${response.status}): ${JSON.stringify(response.data)}`,
        );
        throw new InternalServerErrorException(
          'Failed to create merchant login credentials',
        );
      }

      const user = response.data as Record<string, unknown>;

      await this.auditService.log({
        event: MerchantAuditEvent.MERCHANT_INVITE_SENT,
        action: 'CREATE',
        resource: 'users',
        description: `Merchant invite created for ${email} / ${mobile}`,
        targetId: asString(user.id) || null,
        name: `${asString(user.first_name)} ${asString(user.last_name)}`.trim(),
        role: MERCHANT_ROLE,
        mobile,
        email,
        changedFields: ['mobile', 'email', 'role', 'password_hash'],
        newValues: {
          id: user.id,
          company_name: user.company_name,
          first_name: user.first_name,
          last_name: user.last_name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
        },
        metadata: { source: 'sendInvite' },
      });

      await this.merchantInviteService.createFromSendInvite(body, user);

      return {
        message: 'Merchant invite created successfully',
        login_mobile: user.mobile,
        generated_password: user.generated_password,
        user: {
          id: user.id,
          company_name: user.company_name,
          first_name: user.first_name,
          last_name: user.last_name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          must_change_password: user.must_change_password,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      if (!(error instanceof HttpException)) {
        const axiosError = error as AxiosError;
        this.logger.error(
          `sendInvite failed: ${axiosError.message ?? 'unknown error'}`,
        );
      }

      await this.auditService.log({
        event: MerchantAuditEvent.MERCHANT_INVITE_FAILED,
        action: 'CREATE',
        status: 'FAILED',
        resource: 'users',
        description: `Merchant invite failed for ${email} / ${mobile}`,
        mobile,
        email,
        role: MERCHANT_ROLE,
        metadata: {
          source: 'sendInvite',
          error: error instanceof Error ? error.message : 'unknown',
        },
      });

      throw this.toRpcException(error);
    }
  }

  /**
   * GST → CIN lookup → company details → combined merchantProfile.
   * Persists merchants + directors under a new clientId.
   */
  async addMerchantDetails(body: AddMerchantDetailsDto) {
    try {
      return await this.addMerchantDetailsInternal(body);
    } catch (error) {
      await this.auditService.log({
        event: MerchantAuditEvent.MERCHANT_PROFILE_FAILED,
        action: 'CREATE',
        status: 'FAILED',
        resource: 'merchants',
        description: `addMerchantDetails failed for GSTIN ${String(body.gstNumber ?? '')}`,
        metadata: {
          gstNumber: body.gstNumber,
          error: error instanceof Error ? error.message : 'unknown',
        },
      });
      throw this.toRpcException(error);
    }
  }

  private async addMerchantDetailsInternal(body: AddMerchantDetailsDto) {
    const gstNumber = String(body.gstNumber ?? '').trim().toUpperCase();

    this.logger.log(`addMerchantDetails started for GSTIN=${gstNumber}`);

    const invite = await this.merchantInviteService.findInviteByUserIdOrMobile(
      body.userId,
      body.mobile,
    );

    const boundMerchant = invite?.client_id
      ? await this.merchantRepository.findOne({
          where: { client_id: invite.client_id },
        })
      : null;

    if (boundMerchant) {
      this.assertSameGstOnboarding(gstNumber, boundMerchant);
    }

    if (invite && this.isMerchantDetailsCompleted(invite)) {
      this.logger.log(
        `Merchant details already completed for userId=${invite.user_id} — skipping insert`,
      );

      if (!invite.client_id) {
        return {
          existing: true,
          merchantDetailsCompleted: true,
          clientId: null,
          message: 'Merchant details already completed; no data inserted',
        };
      }

      const completedMerchant = await this.merchantRepository.findOne({
        where: { client_id: invite.client_id },
      });

      if (completedMerchant) {
        return {
          ...(await this.buildExistingMerchantResult(completedMerchant)),
          merchantDetailsCompleted: true,
        };
      }

      return {
        existing: true,
        merchantDetailsCompleted: true,
        clientId: invite.client_id,
        message: 'Merchant details already completed; no data inserted',
      };
    }

    const existing = await this.merchantRepository.findOne({
      where: { gstin: gstNumber },
    });
    if (existing) {
      if (invite?.client_id && invite.client_id !== existing.client_id) {
        throw badRequestForField(
          'gstNumber',
          `Onboarding is already started for a different merchant. GSTIN ${gstNumber} cannot be used on this account.`,
        );
      }
      this.logger.log(
        `GSTIN ${gstNumber} already exists — returning stored merchant clientId=${existing.client_id}`,
      );
      if (body.userId) {
        await this.merchantInviteService.linkClientId(
          body.userId,
          existing.client_id,
        );
      } else if (body.mobile) {
        await this.merchantInviteService.linkClientIdByMobile(
          body.mobile,
          existing.client_id,
        );
      }
      return this.buildExistingMerchantResult(existing);
    }

    // 1) verifyGST
    const gstResponse = await this.kycClientService.verifyGst(gstNumber);
    this.logger.log(`verifyGST status=${String(gstResponse.status)}`);
    if (String(gstResponse.status ?? '').toUpperCase() !== 'SUCCESS') {
      throw badRequestForField(
        'gstNumber',
        asString(gstResponse.message) || 'GST verification failed',
      );
    }

    const gstData = asRecord(gstResponse.data);
    const basic = asRecord(gstData.basicDetails);
    const legalName = asString(basic.Legal_Name);
    if (!legalName) {
      throw badRequestForField(
        'gstNumber',
        'Legal name not found in GST verification response',
      );
    }

    if (
      boundMerchant &&
      this.companyNamesDiffer(
        legalName,
        boundMerchant.legal_name,
        boundMerchant.trade_name,
      )
    ) {
      throw badRequestForField(
        'gstNumber',
        `GSTIN ${gstNumber} belongs to "${legalName}", which does not match the onboarded merchant "${boundMerchant.legal_name || boundMerchant.trade_name}". A different merchant is not allowed.`,
      );
    }

    // 2) getCINnoByCompanyName (from GST legal name)
    const cinLookupResponse =
      await this.kycClientService.getCinByCompanyName(legalName);
    this.logger.log(
      `getCINnoByCompanyName status=${String(cinLookupResponse.status)} message=${asString(cinLookupResponse.message)}`,
    );

    const cinMatch = selectCinMatch(legalName, cinLookupResponse);
    let selectedCin = cinMatch.cin;
    const selectedCinRow = cinMatch.row;

    if (!selectedCin) {
      const vendorMessage = asString(cinLookupResponse.message);
      throw badRequestForField(
        'cin',
        vendorMessage
          ? `CIN lookup failed: ${vendorMessage}`
          : `CIN not found for company name "${legalName}"`,
      );
    }

    // 3) getCompanyDetailsByCINno (from CIN)
    const companyResponse =
      await this.kycClientService.getCompanyDetailsByCin(selectedCin);
    this.logger.log(
      `getCompanyDetailsByCINno status=${String(companyResponse.status)} cin=${selectedCin}`,
    );

    const { company, directors, authorizedSignatories } =
      unwrapCompanyPayload(companyResponse);

    if (String(companyResponse.status ?? '').toUpperCase() !== 'SUCCESS') {
      throw badRequestForField(
        'cin',
        asString(companyResponse.message) ||
          `Company details failed for CIN ${selectedCin}`,
      );
    }

    // Prefer CIN/PAN consistency with GSTIN when available.
    const panFromGstin = extractPanFromGstin(gstNumber);
    const companyPan = asString(company.pan).toUpperCase();
    if (panFromGstin && companyPan && companyPan !== panFromGstin) {
      throw badRequestForField(
        'gstNumber',
        `Company PAN (${companyPan}) does not match GSTIN PAN (${panFromGstin}) for CIN ${selectedCin}`,
      );
    }

    selectedCin = asString(company.cin) || selectedCin;

    const merchantProfile = buildMerchantProfile({
      gstResponse,
      cinLookupResponse,
      companyResponse,
      selectedCin,
      selectedCinRow,
    });

    this.logger.log(
      `profile ready: cin=${selectedCin} directors=${directors.length} signatories=${authorizedSignatories.length}`,
    );

    const clientId = randomUUID();
    const tradeName = asString(basic.tradeNam) || null;
    const requestId = clientId;

    await this.auditService.log({
      event: MerchantAuditEvent.GST_VERIFIED,
      action: 'VERIFY',
      resource: 'gst',
      description: `GST verified for ${gstNumber} (${legalName})`,
      name: legalName,
      changedFields: ['gstin', 'legal_name'],
      newValues: {
        gstin: gstNumber,
        legal_name: legalName,
        trade_name: tradeName,
      },
      metadata: {
        status: gstResponse.status,
        request_id: gstResponse.requestid ?? gstResponse.request_id,
      },
      requestId,
    });

    await this.auditService.log({
      event: MerchantAuditEvent.CIN_LOOKUP_COMPLETED,
      action: 'FETCH',
      resource: 'cin',
      description: `CIN lookup completed for ${legalName}`,
      name: legalName,
      newValues: {
        selected_cin: selectedCin,
        vendor_status: cinLookupResponse.status,
        vendor_message: cinLookupResponse.message,
      },
      requestId,
    });

    await this.auditService.log({
      event: MerchantAuditEvent.COMPANY_DETAILS_FETCHED,
      action: 'FETCH',
      resource: 'company',
      description: `Company details fetched for CIN ${selectedCin}`,
      name: asString(company.company) || legalName,
      newValues: {
        cin: selectedCin,
        directors_count: directors.length,
        signatories_count: authorizedSignatories.length,
      },
      requestId,
    });

    await this.dataSource.transaction(async (manager) => {
      const merchant = manager.create(Merchant, {
        client_id: clientId,
        gstin: gstNumber,
        cin: selectedCin || null,
        legal_name: legalName,
        trade_name: tradeName,
        status: 'pending',
        verification_status: 'pending',
        onboarding_type: 'with_gst',
        selected_merchant_profile: null,
        merchant_profile: merchantProfile as unknown as Record<string, unknown>,
        raw_gst_response: gstResponse,
        raw_cin_lookup_response: cinLookupResponse,
        raw_company_response: companyResponse,
      });
      const savedMerchant = await manager.save(merchant);

      await this.auditService.log(
        {
          event: MerchantAuditEvent.MERCHANT_PROFILE_CREATED,
          action: 'CREATE',
          resource: 'merchants',
          description: `Merchant profile created for GSTIN ${gstNumber}`,
          targetId: savedMerchant.id,
          name: legalName,
          changedFields: [
            'client_id',
            'gstin',
            'cin',
            'legal_name',
            'trade_name',
            'status',
            'verification_status',
            'merchant_profile',
          ],
          newValues: {
            id: savedMerchant.id,
            client_id: clientId,
            gstin: gstNumber,
            cin: selectedCin,
            legal_name: legalName,
            trade_name: tradeName,
            status: 'pending',
            verification_status: 'pending',
          },
          metadata: { client_id: clientId },
          requestId,
        },
        manager,
      );

      if (directors.length) {
        const savedDirectors = await manager.save(
          directors.map((person) =>
            manager.create(Director, this.toPersonEntity(clientId, person)),
          ),
        );

        for (const director of savedDirectors) {
          await this.auditService.log(
            {
              event: MerchantAuditEvent.DIRECTOR_CREATED,
              action: 'CREATE',
              resource: 'directors',
              description: `Director created: ${director.full_name ?? director.din}`,
              targetId: director.id,
              name: director.full_name,
              changedFields: [
                'client_id',
                'din',
                'pan',
                'first_name',
                'middle_name',
                'last_name',
                'full_name',
                'date_of_appointment',
                'disqualified',
              ],
              newValues: {
                id: director.id,
                client_id: director.client_id,
                din: director.din,
                pan: director.pan,
                full_name: director.full_name,
                date_of_appointment: director.date_of_appointment,
                disqualified: director.disqualified,
              },
              metadata: { client_id: clientId, gstin: gstNumber },
              requestId,
            },
            manager,
          );
        }
      }

      if (authorizedSignatories.length) {
        const savedSignatories = await manager.save(
          authorizedSignatories.map((person) =>
            manager.create(
              AuthorizedSignatory,
              this.toPersonEntity(clientId, person),
            ),
          ),
        );

        for (const signatory of savedSignatories) {
          await this.auditService.log(
            {
              event: MerchantAuditEvent.AUTHORIZED_SIGNATORY_CREATED,
              action: 'CREATE',
              resource: 'authorized_signatory_details',
              description: `Authorized signatory created: ${signatory.full_name ?? signatory.din}`,
              targetId: signatory.id,
              name: signatory.full_name,
              changedFields: [
                'client_id',
                'din',
                'pan',
                'first_name',
                'middle_name',
                'last_name',
                'full_name',
                'date_of_appointment',
                'disqualified',
              ],
              newValues: {
                id: signatory.id,
                client_id: signatory.client_id,
                din: signatory.din,
                pan: signatory.pan,
                full_name: signatory.full_name,
                date_of_appointment: signatory.date_of_appointment,
                disqualified: signatory.disqualified,
              },
              metadata: { client_id: clientId, gstin: gstNumber },
              requestId,
            },
            manager,
          );
        }
      }
    });

    if (body.userId) {
      await this.merchantInviteService.linkClientId(body.userId, clientId);
    } else if (body.mobile) {
      await this.merchantInviteService.linkClientIdByMobile(body.mobile, clientId);
    }

    await this.merchantOnboardingTrackService.markSectionsDraftAfterGstBootstrap(
      clientId,
      body.userId,
    );

    await this.merchantInviteService.refreshProgress(clientId);

    return {
      clientId,
      status: 'pending',
      verification_status: 'pending',
      onboardingType: 'with_gst',
      sections: await this.getOnboardingStatusByClient(clientId).then(
        (result) => result.sections,
      ),
      merchantProfile,
      directorsSaved: directors.length,
      authorizedSignatoriesSaved: authorizedSignatories.length,
      ...this.toVendorKycResponses(
        gstResponse,
        cinLookupResponse,
        companyResponse,
      ),
    };
  }

  async getMerchant(clientId: string) {
    try {
      const merchant = await this.findMerchantByClientId(clientId);
      const directors = await this.directorRepository.find({
        where: { client_id: clientId, status: 'active' },
        order: { created_at: 'ASC' },
      });
      const authorizedSignatories =
        await this.authorizedSignatoryRepository.find({
          where: { client_id: clientId, status: 'active' },
          order: { created_at: 'ASC' },
        });
      const bankDetails = await this.bankDetailRepository.find({
        where: { client_id: clientId, status: 'active' },
        order: { created_at: 'ASC' },
      });

      return this.toMerchantResponse(
        merchant,
        directors,
        authorizedSignatories,
        bankDetails,
      );
    } catch (error) {
      throw this.toRpcException(error);
    }
  }

  async updateMerchant(clientId: string, body: UpdateMerchantDto) {
    try {
      return await this.updateMerchantInternal(clientId, body);
    } catch (error) {
      await this.auditService.log({
        event: MerchantAuditEvent.MERCHANT_PROFILE_FAILED,
        action: 'UPDATE',
        status: 'FAILED',
        resource: 'merchants',
        description: `updateMerchant failed for clientId ${clientId}`,
        metadata: {
          clientId,
          error: error instanceof Error ? error.message : 'unknown',
        },
      });
      throw this.toRpcException(error);
    }
  }

  async deleteMerchant(clientId: string) {
    try {
      const merchant = await this.findMerchantByClientId(clientId);
      if (merchant.status === 'deleted') {
        throw new BadRequestException('Merchant is already deleted');
      }

      const previousStatus = merchant.status;
      merchant.status = 'deleted';
      const saved = await this.merchantRepository.save(merchant);

      await this.auditService.log({
        event: MerchantAuditEvent.MERCHANT_PROFILE_DELETED,
        action: 'DELETE',
        resource: 'merchants',
        description: `Merchant soft-deleted for clientId ${clientId}`,
        targetId: saved.id,
        name: saved.legal_name,
        changedFields: ['status'],
        oldValues: { status: previousStatus },
        newValues: { status: 'deleted' },
        metadata: { client_id: clientId },
      });

      return {
        clientId: saved.client_id,
        status: saved.status,
        message: 'Merchant deleted successfully',
      };
    } catch (error) {
      await this.auditService.log({
        event: MerchantAuditEvent.MERCHANT_PROFILE_FAILED,
        action: 'DELETE',
        status: 'FAILED',
        resource: 'merchants',
        description: `deleteMerchant failed for clientId ${clientId}`,
        metadata: {
          clientId,
          error: error instanceof Error ? error.message : 'unknown',
        },
      });
      throw this.toRpcException(error);
    }
  }

  private async updateMerchantInternal(
    clientId: string,
    body: UpdateMerchantDto,
  ) {
    const merchant = await this.findMerchantByClientId(clientId);
    if (merchant.status === 'deleted') {
      throw new BadRequestException('Cannot update a deleted merchant');
    }

    const oldValues: Record<string, unknown> = {};
    const changedFields: string[] = [];

    if (body.gstin !== undefined) {
      const gstin = String(body.gstin).trim().toUpperCase();
      if (!gstin) {
        throw new BadRequestException('gstin cannot be empty');
      }
      if (gstin !== merchant.gstin) {
        const duplicate = await this.merchantRepository.findOne({
          where: { gstin },
        });
        if (duplicate && duplicate.client_id !== clientId) {
          throw new ConflictException('Merchant with this GSTIN already exists');
        }
        oldValues.gstin = merchant.gstin;
        merchant.gstin = gstin;
        changedFields.push('gstin');
      }
    }

    if (body.cin !== undefined) {
      oldValues.cin = merchant.cin;
      merchant.cin = body.cin ? String(body.cin).trim().toUpperCase() : null;
      changedFields.push('cin');
    }

    if (body.legalName !== undefined) {
      oldValues.legal_name = merchant.legal_name;
      merchant.legal_name = body.legalName;
      changedFields.push('legal_name');
    }

    if (body.tradeName !== undefined) {
      oldValues.trade_name = merchant.trade_name;
      merchant.trade_name = body.tradeName;
      changedFields.push('trade_name');
    }

    if (body.status !== undefined) {
      oldValues.status = merchant.status;
      merchant.status = body.status;
      changedFields.push('status');
    }

    if (body.verificationStatus !== undefined) {
      oldValues.verification_status = merchant.verification_status;
      merchant.verification_status = body.verificationStatus;
      changedFields.push('verification_status');
    }

    if (body.merchantProfile !== undefined) {
      oldValues.merchant_profile = merchant.merchant_profile;
      merchant.merchant_profile = body.merchantProfile;
      changedFields.push('merchant_profile');
    }

    if (body.rawGstResponse !== undefined) {
      oldValues.raw_gst_response = merchant.raw_gst_response;
      merchant.raw_gst_response = body.rawGstResponse;
      changedFields.push('raw_gst_response');
    }

    if (body.rawCinLookupResponse !== undefined) {
      oldValues.raw_cin_lookup_response = merchant.raw_cin_lookup_response;
      merchant.raw_cin_lookup_response = body.rawCinLookupResponse;
      changedFields.push('raw_cin_lookup_response');
    }

    if (body.rawCompanyResponse !== undefined) {
      oldValues.raw_company_response = merchant.raw_company_response;
      merchant.raw_company_response = body.rawCompanyResponse;
      changedFields.push('raw_company_response');
    }

    if (!changedFields.length && !body.directors && !body.authorizedSignatories) {
      throw new BadRequestException('At least one field is required to update');
    }

    await this.dataSource.transaction(async (manager) => {
      const savedMerchant = await manager.save(merchant);

      if (changedFields.length) {
        await this.auditService.log(
          {
            event: MerchantAuditEvent.MERCHANT_PROFILE_UPDATED,
            action: 'UPDATE',
            resource: 'merchants',
            description: `Merchant profile updated for clientId ${clientId}`,
            targetId: savedMerchant.id,
            name: savedMerchant.legal_name,
            changedFields,
            oldValues,
            newValues: {
              gstin: savedMerchant.gstin,
              cin: savedMerchant.cin,
              legal_name: savedMerchant.legal_name,
              trade_name: savedMerchant.trade_name,
              status: savedMerchant.status,
              verification_status: savedMerchant.verification_status,
            },
            metadata: { client_id: clientId },
          },
          manager,
        );
      }

      if (body.directors !== undefined) {
        await manager.delete(Director, { client_id: clientId });
        if (body.directors.length) {
          await manager.save(
            body.directors.map((person) =>
              manager.create(
                Director,
                this.toPersonEntityFromUpdate(clientId, person),
              ),
            ),
          );
        }
      }

      if (body.authorizedSignatories !== undefined) {
        await manager.delete(AuthorizedSignatory, { client_id: clientId });
        if (body.authorizedSignatories.length) {
          await manager.save(
            body.authorizedSignatories.map((person) =>
              manager.create(
                AuthorizedSignatory,
                this.toPersonEntityFromUpdate(clientId, person),
              ),
            ),
          );
        }
      }
    });

    const directors = await this.directorRepository.find({
      where: { client_id: clientId, status: 'active' },
      order: { created_at: 'ASC' },
    });
    const authorizedSignatories = await this.authorizedSignatoryRepository.find({
      where: { client_id: clientId, status: 'active' },
      order: { created_at: 'ASC' },
    });
    const bankDetails = await this.bankDetailRepository.find({
      where: { client_id: clientId, status: 'active' },
      order: { created_at: 'ASC' },
    });
    const updatedMerchant = await this.findMerchantByClientId(clientId);

    return {
      message: 'Merchant updated successfully',
      ...this.toMerchantResponse(
        updatedMerchant,
        directors,
        authorizedSignatories,
        bankDetails,
      ),
    };
  }

  private isMerchantDetailsCompleted(invite: MerchantInvite): boolean {
    if (invite.merchant_details_completed) {
      return true;
    }

    const sectionStatus =
      invite.section_statuses?.[OnboardingSectionKey.MERCHANT_DETAILS];
    return isSectionSubmitted(sectionStatus ?? '');
  }

  private async buildExistingMerchantResult(merchant: Merchant) {
    const directors = await this.directorRepository.find({
      where: { client_id: merchant.client_id, status: 'active' },
      order: { created_at: 'ASC' },
    });
    const authorizedSignatories =
      await this.authorizedSignatoryRepository.find({
        where: { client_id: merchant.client_id, status: 'active' },
        order: { created_at: 'ASC' },
      });
    const bankDetails = await this.bankDetailRepository.find({
      where: { client_id: merchant.client_id, status: 'active' },
      order: { created_at: 'ASC' },
    });

    return {
      ...this.toMerchantResponse(
        merchant,
        directors,
        authorizedSignatories,
        bankDetails,
      ),
      directorsSaved: directors.length,
      authorizedSignatoriesSaved: authorizedSignatories.length,
      existing: true,
      ...this.toVendorKycResponses(
        merchant.raw_gst_response,
        merchant.raw_cin_lookup_response,
        merchant.raw_company_response,
      ),
    };
  }

  private toVendorKycResponses(
    gstResponse: Record<string, unknown> | null | undefined,
    cinLookupResponse: Record<string, unknown> | null | undefined,
    companyResponse: Record<string, unknown> | null | undefined,
  ) {
    return {
      verifyGST: gstResponse ?? null,
      getCINnoByCompanyName: cinLookupResponse ?? null,
      getCompanyDetailsByCINno: companyResponse ?? null,
    };
  }

  private async findMerchantByClientId(clientId: string): Promise<Merchant> {
    const normalizedClientId = String(clientId ?? '').trim();
    if (!normalizedClientId) {
      throw new BadRequestException('clientId is required');
    }

    const merchant = await this.merchantRepository.findOne({
      where: { client_id: normalizedClientId },
    });
    if (!merchant) {
      throw new NotFoundException(
        `Merchant not found for clientId ${normalizedClientId}`,
      );
    }

    return merchant;
  }

  private assertSameGstOnboarding(gstNumber: string, merchant: Merchant) {
    const boundGstin = String(merchant.gstin ?? '').trim().toUpperCase();
    if (!boundGstin) {
      return;
    }

    if (boundGstin === gstNumber) {
      return;
    }

    throw badRequestForField(
      'gstNumber',
      `Onboarding is already started with GSTIN ${boundGstin} (${merchant.legal_name || merchant.trade_name || 'existing merchant'}). A different GSTIN or merchant name is not allowed.`,
    );
  }

  private companyNamesDiffer(
    incomingName: string,
    legalName?: string | null,
    tradeName?: string | null,
  ): boolean {
    const incoming = this.normalizeCompanyName(incomingName);
    if (!incoming) {
      return false;
    }

    const known = [legalName, tradeName]
      .map((name) => this.normalizeCompanyName(name))
      .filter(Boolean);

    if (!known.length) {
      return false;
    }

    return !known.some(
      (name) => name === incoming || name.includes(incoming) || incoming.includes(name),
    );
  }

  private normalizeCompanyName(name?: string | null): string {
    return String(name ?? '')
      .toUpperCase()
      .replace(/PRIVATE LIMITED|PVT LTD|PVT\. LTD\.|LIMITED|LTD/g, '')
      .replace(/[^A-Z0-9]/g, '');
  }

  private toMerchantResponse(
    merchant: Merchant,
    directors: Director[],
    authorizedSignatories: AuthorizedSignatory[],
    bankDetails: BankDetail[] = [],
  ) {
    return {
      clientId: merchant.client_id,
      gstin: merchant.gstin,
      cin: merchant.cin,
      legalName: merchant.legal_name,
      tradeName: merchant.trade_name,
      status: merchant.status,
      verificationStatus: merchant.verification_status,
      merchantProfile: merchant.merchant_profile,
      rawGstResponse: merchant.raw_gst_response,
      rawCinLookupResponse: merchant.raw_cin_lookup_response,
      rawCompanyResponse: merchant.raw_company_response,
      directors: directors.map((person) => this.toPersonResponse(person)),
      authorizedSignatories: authorizedSignatories.map((person) =>
        this.toPersonResponse(person),
      ),
      bankDetails: bankDetails.map(toBankDetailResponse),
      createdAt: merchant.created_at,
      updatedAt: merchant.updated_at,
    };
  }

  private toPersonResponse(person: Director | AuthorizedSignatory) {
    return {
      id: person.id,
      clientId: person.client_id,
      din: person.din,
      pan: person.pan,
      firstName: person.first_name,
      middleName: person.middle_name,
      lastName: person.last_name,
      fullName: person.full_name,
      dateOfAppointment: person.date_of_appointment,
      disqualified: person.disqualified,
      isVerified: person.is_verified,
      rejectionReason: person.rejection_reason,
      sessionId: person.session_id,
      videoKycUrl: person.video_kyc_url,
      faceVideoUrl: person.face_video_url,
      aadhaarPhotoUrl: person.aadhaar_photo_url,
      panPhotoUrl: person.pan_photo_url,
      videoKycStatus: person.video_kyc_status,
      isVkycVerified: person.is_vkyc_verified,
      vkycRejectionReason: person.vkyc_rejection_reason,
      status: person.status,
      createdAt: person.created_at,
      updatedAt: person.updated_at,
    };
  }

  private toPersonEntityFromUpdate(
    clientId: string,
    person: UpdatePersonDto,
  ): Partial<Director> {
    return {
      client_id: clientId,
      din: person.din ?? null,
      pan: person.pan ?? null,
      first_name: person.firstName ?? null,
      middle_name: person.middleName ?? null,
      last_name: person.lastName ?? null,
      full_name: person.fullName ?? null,
      date_of_appointment: person.dateOfAppointment ?? null,
      disqualified: person.disqualified ?? false,
      is_verified: person.isVerified ?? false,
      video_kyc_url: person.videoKycUrl ?? null,
      video_kyc_status: person.videoKycStatus ?? null,
      is_vkyc_verified: person.isVkycVerified ?? false,
      status: person.status ?? 'active',
    };
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

    this.logger.error(
      `addMerchantDetails unexpected error: ${error instanceof Error ? error.message : 'unknown'}`,
      error instanceof Error ? error.stack : undefined,
    );

    return new RpcException({
      statusCode: 500,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to add merchant details',
      error: 'Internal Server Error',
    });
  }

  private toPersonEntity(
    clientId: string,
    person: MerchantProfileDirector,
  ): {
    client_id: string;
    din: string | null;
    pan: string | null;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    full_name: string | null;
    date_of_appointment: string | null;
    disqualified: boolean;
    is_verified: boolean;
    video_kyc_url: null;
    video_kyc_status: null;
    is_vkyc_verified: boolean;
    status: string;
  } {
    return {
      client_id: clientId,
      din: person.din || null,
      pan: person.pan || null,
      first_name: person.firstName || null,
      middle_name: person.middleName || null,
      last_name: person.lastName || null,
      full_name: person.fullName || null,
      date_of_appointment: person.dateOfAppointment || null,
      disqualified: person.disqualified,
      is_verified: false,
      video_kyc_url: null,
      video_kyc_status: null,
      is_vkyc_verified: false,
      status: 'active',
    };
  }

  private async findMerchantUserByMobileOrEmail(
    mobile: string,
    email: string,
  ): Promise<{
    id: string;
    company_name: string;
    first_name: string;
    last_name: string;
    mobile: string;
    email: string;
    role: string;
    is_active: number;
    must_change_password: boolean;
    created_at: Date;
  } | null> {
    const rows = (await this.dataSource.query(
      `SELECT id, company_name, first_name, last_name, mobile, email, role,
              is_active, must_change_password, created_at
       FROM users
       WHERE role = $1 AND (mobile = $2 OR LOWER(email) = $3)
       LIMIT 1`,
      [MERCHANT_ROLE, mobile, email.toLowerCase()],
    )) as Array<{
      id: string;
      company_name: string;
      first_name: string;
      last_name: string;
      mobile: string;
      email: string;
      role: string;
      is_active: number;
      must_change_password: boolean;
      created_at: Date;
    }>;

    return rows[0] ?? null;
  }

  private conflictFromRegister(
    mobile: string,
    email: string,
    data: unknown,
  ): ConflictException {
    const message =
      (data as { message?: string })?.message ??
      'User with this email or mobile already exists';
    const field = /mobile/i.test(message) ? 'mobile' : 'email';
    return this.conflictForField(
      field,
      field === 'mobile'
        ? `Mobile ${mobile} is already registered`
        : `Email ${email} is already registered`,
    );
  }

  private conflictForField(field: string, message: string): ConflictException {
    return new ConflictException({
      statusCode: 409,
      message,
      error: 'Conflict',
      errors: [{ field, message }],
    });
  }

  private async assertMobileAndEmailAvailable(
    mobile: string,
    email: string,
  ): Promise<void> {
    const rows = (await this.dataSource.query(
      `SELECT mobile, email, role
       FROM users
       WHERE mobile = $1 OR LOWER(email) = $2
       LIMIT 1`,
      [mobile, email.toLowerCase()],
    )) as Array<{ mobile: string; email: string; role: string }>;

    if (!rows.length) {
      return;
    }

    const existing = rows[0];
    if (existing.mobile === mobile) {
      throw this.conflictForField(
        'mobile',
        `Mobile ${mobile} is already registered as ${existing.role}. Use a different merchant mobile.`,
      );
    }
    throw this.conflictForField(
      'email',
      `Email ${existing.email} is already registered as ${existing.role}. Use a different merchant email.`,
    );
  }

  private buildAuthRegisterUrl(): string {
    let host = this.configService.get<string>('GATEWAY_HOST', 'localhost');
    if (host === 'GATEWAY_HOST' || !host) {
      host = 'localhost';
    }
    const port = this.configService.get<number>('GATEWAY_PORT', 3000);
    return `http://${host}:${port}/v2/api/auth/register`;
  }
}


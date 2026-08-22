import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { MerchantAuditEvent } from './constants/audit-event.constants';
import {
  MerchantInviteListStatus,
  isPersonVideoKycComplete,
} from './constants/merchant-invite-status.constants';
import {
  DEFAULT_SECTION_STATUS_MAP,
  ONBOARDING_SECTIONS,
  OnboardingSectionKey,
  OnboardingSectionStatus,
  OnboardingType,
  OverallOnboardingStatus,
  REQUIRED_DOCUMENT_TYPES,
  SectionStatusMap,
} from './constants/onboarding-section.constants';
import { StartOnboardingDto } from './dto/start-onboarding.dto';
import { SubmitMerchantDetailsSectionDto } from './dto/submit-merchant-details-section.dto';
import { AuthorizedSignatory } from './entities/authorized-signatory.entity';
import { BankDetail } from './entities/bank-detail.entity';
import { Director } from './entities/director.entity';
import { MerchantDocument } from './entities/merchant-document.entity';
import { MerchantInvite } from './entities/merchant-invite.entity';
import { Merchant } from './entities/merchant.entity';
import {
  buildMerchantDetailsFormConfig,
  normalizeMerchantDetailsSelections,
} from './merchant-onboarding-form.service';
import { MerchantInviteService } from './merchant-invite.service';
import { MerchantContextService } from './merchant-context.service';

@Injectable()
export class MerchantOnboardingTrackService {
  constructor(
    private readonly auditService: AuditService,
    private readonly merchantInviteService: MerchantInviteService,
    private readonly merchantContextService: MerchantContextService,
    @InjectRepository(MerchantInvite)
    private readonly merchantInviteRepository: Repository<MerchantInvite>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(AuthorizedSignatory)
    private readonly authorizedSignatoryRepository: Repository<AuthorizedSignatory>,
    @InjectRepository(BankDetail)
    private readonly bankDetailRepository: Repository<BankDetail>,
    @InjectRepository(MerchantDocument)
    private readonly documentRepository: Repository<MerchantDocument>,
  ) {}

  async startOnboarding(body: StartOnboardingDto) {
    const invite = await this.merchantInviteRepository.findOne({
      where: { user_id: body.userId },
    });

    if (!invite) {
      throw new NotFoundException('Merchant invite not found for this user');
    }

    if (this.isOnboardingLocked(invite)) {
      return this.getOnboardingStatus(body.userId);
    }

    if (body.onboardingType === OnboardingType.WITHOUT_GST) {
      if (invite.client_id) {
        return this.getOnboardingStatus(body.userId);
      }

      const clientId = randomUUID();
      const merchant = this.merchantRepository.create({
        client_id: clientId,
        gstin: null,
        cin: null,
        legal_name: invite.company_name,
        trade_name: invite.company_name,
        status: 'pending',
        verification_status: 'pending',
        onboarding_type: OnboardingType.WITHOUT_GST,
        merchant_profile: {
          business: { legalName: invite.company_name },
          contact: { email: invite.email },
          verification: {
            gstVerified: false,
            cinVerified: false,
            companyVerified: false,
          },
        },
        selected_merchant_profile: null,
        raw_gst_response: null,
        raw_cin_lookup_response: null,
        raw_company_response: null,
      });

      await this.merchantRepository.save(merchant);

      invite.client_id = clientId;
      invite.onboarding_type = OnboardingType.WITHOUT_GST;
      invite.overall_onboarding_status = OverallOnboardingStatus.IN_PROGRESS;
      invite.section_statuses = this.setSectionStatus(
        invite.section_statuses,
        OnboardingSectionKey.MERCHANT_DETAILS,
        OnboardingSectionStatus.DRAFT,
      );
      await this.merchantInviteRepository.save(invite);

      return this.getOnboardingStatus(body.userId);
    }

    invite.onboarding_type = OnboardingType.WITH_GST;
    invite.overall_onboarding_status = OverallOnboardingStatus.IN_PROGRESS;
    await this.merchantInviteRepository.save(invite);

    return {
      userId: body.userId,
      clientId: invite.client_id,
      onboardingType: invite.onboarding_type,
      overallOnboardingStatus: invite.overall_onboarding_status,
      nextStep: invite.client_id ? 'continue_onboarding' : 'enter_gst',
      sections: this.getSectionStatuses(invite),
    };
  }

  async getOnboardingStatus(userId: string) {
    const invite = await this.requireInviteByUserId(userId);

    return {
      userId: invite.user_id,
      clientId: invite.client_id,
      onboardingType: invite.onboarding_type,
      overallOnboardingStatus: invite.overall_onboarding_status,
      makerSubmittedAt: invite.maker_submitted_at,
      sections: this.getSectionStatuses(invite),
      canComplete: this.canCompleteOnboarding(invite),
    };
  }

  async getOnboardingStatusByClientId(clientId: string) {
    const invite = await this.requireInviteByClientId(clientId);
    return this.getOnboardingStatus(invite.user_id);
  }

  async getMerchantDetailsFormConfig(clientId: string) {
    const merchant = await this.merchantContextService.findMerchantByClientId(
      clientId,
    );
    const invite = await this.requireInviteByClientId(clientId);
    const sectionStatus =
      this.getSectionStatuses(invite)[OnboardingSectionKey.MERCHANT_DETAILS];

    return buildMerchantDetailsFormConfig({
      clientId,
      onboardingType: merchant.onboarding_type ?? invite.onboarding_type,
      sectionStatus,
      merchantProfile: merchant.merchant_profile ?? {},
      selectedProfile: merchant.selected_merchant_profile,
    });
  }

  async submitMerchantDetailsSection(
    clientId: string,
    body: SubmitMerchantDetailsSectionDto,
  ) {
    const merchant = await this.merchantContextService.findMerchantByClientId(
      clientId,
    );
    const invite = await this.requireInviteByClientId(clientId);

    merchant.selected_merchant_profile = normalizeMerchantDetailsSelections(
      body.selections ?? {},
    );
    await this.merchantRepository.save(merchant);

    await this.setSectionAndSave(
      invite,
      OnboardingSectionKey.MERCHANT_DETAILS,
      OnboardingSectionStatus.VERIFICATION_PENDING,
    );

    return {
      message: 'Merchant details submitted for verification',
      clientId,
      section: OnboardingSectionKey.MERCHANT_DETAILS,
      sectionStatus: OnboardingSectionStatus.VERIFICATION_PENDING,
      sections: this.getSectionStatuses(invite),
    };
  }

  async submitDirectorsSection(clientId: string) {
    const invite = await this.requireInviteByClientId(clientId);
    const count = await this.directorRepository.count({
      where: { client_id: clientId, status: 'active' },
    });

    if (count < 1) {
      throw new BadRequestException(
        'At least one active director is required before submit',
      );
    }

    await this.setSectionAndSave(
      invite,
      OnboardingSectionKey.DIRECTORS,
      OnboardingSectionStatus.VERIFICATION_PENDING,
    );

    return this.buildSubmitResponse(
      clientId,
      OnboardingSectionKey.DIRECTORS,
      invite,
    );
  }

  async submitAuthorizersSection(clientId: string) {
    const invite = await this.requireInviteByClientId(clientId);
    const count = await this.authorizedSignatoryRepository.count({
      where: { client_id: clientId, status: 'active' },
    });

    if (count < 1) {
      throw new BadRequestException(
        'At least one active authorizer is required before submit',
      );
    }

    await this.setSectionAndSave(
      invite,
      OnboardingSectionKey.AUTHORIZERS,
      OnboardingSectionStatus.VERIFICATION_PENDING,
    );

    return this.buildSubmitResponse(
      clientId,
      OnboardingSectionKey.AUTHORIZERS,
      invite,
    );
  }

  async submitBankDetailsSection(clientId: string) {
    const invite = await this.requireInviteByClientId(clientId);
    const count = await this.bankDetailRepository.count({
      where: { client_id: clientId, status: 'active' },
    });

    if (count < 1) {
      throw new BadRequestException(
        'At least one active bank detail is required before submit',
      );
    }

    await this.setSectionAndSave(
      invite,
      OnboardingSectionKey.BANK_DETAILS,
      OnboardingSectionStatus.VERIFICATION_PENDING,
    );

    return this.buildSubmitResponse(
      clientId,
      OnboardingSectionKey.BANK_DETAILS,
      invite,
    );
  }

  async submitVideoKycSection(clientId: string) {
    const invite = await this.requireInviteByClientId(clientId);

    const directors = await this.directorRepository.find({
      where: { client_id: clientId, status: 'active' },
    });
    const authorizers = await this.authorizedSignatoryRepository.find({
      where: { client_id: clientId, status: 'active' },
    });
    const people = [...directors, ...authorizers];

    if (!people.length) {
      throw new BadRequestException(
        'Directors or authorizers are required before video KYC submit',
      );
    }

    const hasCompletedVideoKyc = people.some(isPersonVideoKycComplete);
    if (!hasCompletedVideoKyc) {
      throw new BadRequestException(
        'Video KYC must be completed for at least one director or authorizer before submit',
      );
    }

    await this.setSectionAndSave(
      invite,
      OnboardingSectionKey.VIDEO_KYC,
      OnboardingSectionStatus.VERIFICATION_PENDING,
    );

    return this.buildSubmitResponse(
      clientId,
      OnboardingSectionKey.VIDEO_KYC,
      invite,
    );
  }

  async submitDocumentsSection(clientId: string) {
    const invite = await this.requireInviteByClientId(clientId);
    const documents = await this.documentRepository.find({
      where: { client_id: clientId },
      order: { created_at: 'DESC' },
    });

    const latestByType = new Map<string, MerchantDocument>();
    for (const document of documents) {
      if (!latestByType.has(document.document_type)) {
        latestByType.set(document.document_type, document);
      }
    }

    const requiredTypes = REQUIRED_DOCUMENT_TYPES.filter((type) => {
      if (type === 'GST' && invite.onboarding_type === OnboardingType.WITHOUT_GST) {
        return false;
      }
      return true;
    });
    const missingTypes = requiredTypes.filter((type) => !latestByType.has(type));

    if (missingTypes.length) {
      throw new BadRequestException(
        `Missing required documents: ${missingTypes.join(', ')}`,
      );
    }

    await this.setSectionAndSave(
      invite,
      OnboardingSectionKey.DOCUMENTS,
      OnboardingSectionStatus.VERIFICATION_PENDING,
    );

    return this.buildSubmitResponse(
      clientId,
      OnboardingSectionKey.DOCUMENTS,
      invite,
    );
  }

  async completeOnboarding(clientId: string) {
    const invite = await this.requireInviteByClientId(clientId);

    if (!this.canCompleteOnboarding(invite)) {
      const pendingSections = ONBOARDING_SECTIONS.filter(
        (section) => !this.isSectionSubmitted(this.getSectionStatuses(invite)[section]),
      );

      throw new BadRequestException(
        `All onboarding sections must be submitted before complete. Pending: ${pendingSections.join(', ')}`,
      );
    }

    await this.promoteToMerchantList(invite);

    return {
      message: 'Onboarding submitted for verification',
      clientId,
      overallOnboardingStatus: invite.overall_onboarding_status,
      makerSubmittedAt: invite.maker_submitted_at,
      verificationStatus: 'verification_pending',
      sections: this.getSectionStatuses(invite),
    };
  }

  async markSectionsDraftAfterGstBootstrap(clientId: string, userId?: string) {
    let invite = await this.merchantInviteRepository.findOne({
      where: { client_id: clientId },
    });

    if (!invite && userId) {
      invite = await this.merchantInviteRepository.findOne({
        where: { user_id: userId },
      });
    }

    if (!invite || this.isOnboardingLocked(invite)) {
      return;
    }

    invite.client_id = clientId;
    invite.onboarding_type = OnboardingType.WITH_GST;
    invite.overall_onboarding_status = OverallOnboardingStatus.IN_PROGRESS;

    let statuses = this.normalizeSectionStatuses(invite.section_statuses);
    statuses[OnboardingSectionKey.MERCHANT_DETAILS] =
      OnboardingSectionStatus.DRAFT;
    statuses[OnboardingSectionKey.DIRECTORS] = OnboardingSectionStatus.DRAFT;
    statuses[OnboardingSectionKey.AUTHORIZERS] = OnboardingSectionStatus.DRAFT;
    invite.section_statuses = statuses;

    const merchant = await this.merchantRepository.findOne({
      where: { client_id: clientId },
    });

    if (merchant) {
      merchant.onboarding_type = OnboardingType.WITH_GST;
      await this.merchantRepository.save(merchant);
    }

    await this.merchantInviteRepository.save(invite);
  }

  private buildSubmitResponse(
    clientId: string,
    section: OnboardingSectionKey,
    invite: MerchantInvite,
  ) {
    return {
      message: `${section} submitted for verification`,
      clientId,
      section,
      sectionStatus: OnboardingSectionStatus.VERIFICATION_PENDING,
      sections: this.getSectionStatuses(invite),
      canComplete: this.canCompleteOnboarding(invite),
    };
  }

  private canCompleteOnboarding(invite: MerchantInvite): boolean {
    const statuses = this.getSectionStatuses(invite);
    return ONBOARDING_SECTIONS.every((section) =>
      this.isSectionSubmitted(statuses[section]),
    );
  }

  private isSectionSubmitted(status?: string): boolean {
    return (
      status === OnboardingSectionStatus.VERIFICATION_PENDING ||
      status === OnboardingSectionStatus.VERIFIED
    );
  }

  private isOnboardingLocked(invite: MerchantInvite): boolean {
    return (
      invite.overall_onboarding_status ===
        OverallOnboardingStatus.MAKER_SUBMITTED ||
      invite.overall_onboarding_status === OverallOnboardingStatus.COMPLETED ||
      invite.overall_onboarding_status === OverallOnboardingStatus.REJECTED
    );
  }

  private async promoteToMerchantList(invite: MerchantInvite): Promise<void> {
    if (!invite.client_id) {
      return;
    }

    const alreadySubmitted =
      invite.overall_onboarding_status ===
        OverallOnboardingStatus.MAKER_SUBMITTED ||
      invite.overall_onboarding_status === OverallOnboardingStatus.COMPLETED;

    invite.overall_onboarding_status = alreadySubmitted
      ? invite.overall_onboarding_status
      : OverallOnboardingStatus.MAKER_SUBMITTED;
    invite.list_status = MerchantInviteListStatus.COMPLETED;
    invite.completed_at = invite.completed_at ?? new Date();
    invite.maker_submitted_at = invite.maker_submitted_at ?? new Date();
    await this.merchantInviteRepository.save(invite);

    const merchant = await this.merchantContextService.findMerchantByClientId(
      invite.client_id,
    );
    if (merchant.verification_status !== 'verified') {
      merchant.verification_status = 'verification_pending';
      await this.merchantRepository.save(merchant);
    }

    if (alreadySubmitted) {
      return;
    }

    await this.auditService.log({
      event: MerchantAuditEvent.MERCHANT_ONBOARDING_MAKER_SUBMITTED,
      action: 'UPDATE',
      resource: 'merchant_invites',
      description: `Maker submitted onboarding for clientId ${invite.client_id}`,
      targetId: invite.id,
      metadata: { client_id: invite.client_id, user_id: invite.user_id },
    });
  }

  private async setSectionAndSave(
    invite: MerchantInvite,
    section: OnboardingSectionKey,
    status: OnboardingSectionStatus,
  ) {
    invite.section_statuses = this.setSectionStatus(
      invite.section_statuses,
      section,
      status,
    );
    if (!this.isOnboardingLocked(invite)) {
      invite.overall_onboarding_status = OverallOnboardingStatus.IN_PROGRESS;
    }
    await this.merchantInviteRepository.save(invite);
    if (invite.client_id) {
      await this.merchantInviteService.refreshProgress(invite.client_id);
    }
    if (this.canCompleteOnboarding(invite)) {
      await this.promoteToMerchantList(invite);
    }
  }

  private setSectionStatus(
    current: Record<string, string> | null | undefined,
    section: OnboardingSectionKey,
    status: OnboardingSectionStatus,
  ): Record<string, string> {
    const map = this.normalizeSectionStatuses(current);
    map[section] = status;
    return map;
  }

  private normalizeSectionStatuses(
    current: Record<string, string> | null | undefined,
  ): SectionStatusMap {
    const defaults = DEFAULT_SECTION_STATUS_MAP();
    const merged = { ...defaults, ...(current ?? {}) } as SectionStatusMap;

    for (const section of ONBOARDING_SECTIONS) {
      if (!merged[section]) {
        merged[section] = OnboardingSectionStatus.NOT_STARTED;
      }
    }

    return merged;
  }

  private getSectionStatuses(invite: MerchantInvite): SectionStatusMap {
    return this.normalizeSectionStatuses(invite.section_statuses);
  }

  private async requireInviteByUserId(userId: string): Promise<MerchantInvite> {
    const invite = await this.merchantInviteRepository.findOne({
      where: { user_id: userId },
    });

    if (!invite) {
      throw new NotFoundException('Merchant onboarding record not found');
    }

    return invite;
  }

  private async requireInviteByClientId(
    clientId: string,
  ): Promise<MerchantInvite> {
    const invite = await this.merchantInviteRepository.findOne({
      where: { client_id: clientId },
    });

    if (!invite) {
      throw new NotFoundException(
        `Merchant onboarding record not found for clientId ${clientId}`,
      );
    }

    return invite;
  }
}

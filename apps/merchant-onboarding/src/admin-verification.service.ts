import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { MerchantAuditEvent } from './constants/audit-event.constants';
import { MERCHANT_DOCUMENT_STATUS } from './constants/document-type.constants';
import { MerchantInviteListStatus } from './constants/merchant-invite-status.constants';
import {
  ONBOARDING_SECTIONS,
  OnboardingSectionKey,
  OnboardingSectionStatus,
  OnboardingType,
  OverallOnboardingStatus,
  REQUIRED_DOCUMENT_TYPES,
  VerificationDecision,
  VerificationTargetType,
} from './constants/onboarding-section.constants';
import {
  AdminDocumentReviewPayloadDto,
  AdminOverallApprovalPayloadDto,
  AdminSectionReviewPayloadDto,
} from './dto/admin-verification.dto';
import { AuthorizedSignatory } from './entities/authorized-signatory.entity';
import { BankDetail } from './entities/bank-detail.entity';
import { Director } from './entities/director.entity';
import { Merchant } from './entities/merchant.entity';
import { MerchantDocument } from './entities/merchant-document.entity';
import { MerchantInvite } from './entities/merchant-invite.entity';
import { MerchantVerificationReview } from './entities/merchant-verification-review.entity';
import { MerchantContextService } from './merchant-context.service';
import { MerchantInviteService } from './merchant-invite.service';
import { toBankDetailResponse } from './mappers/bank-detail.mapper';
import { toPersonResponse } from './mappers/person.mapper';

@Injectable()
export class AdminVerificationService {
  constructor(
    private readonly auditService: AuditService,
    private readonly merchantContextService: MerchantContextService,
    private readonly merchantInviteService: MerchantInviteService,
    @InjectRepository(MerchantInvite)
    private readonly merchantInviteRepository: Repository<MerchantInvite>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(AuthorizedSignatory)
    private readonly authorizerRepository: Repository<AuthorizedSignatory>,
    @InjectRepository(BankDetail)
    private readonly bankDetailRepository: Repository<BankDetail>,
    @InjectRepository(MerchantDocument)
    private readonly documentRepository: Repository<MerchantDocument>,
    @InjectRepository(MerchantVerificationReview)
    private readonly reviewRepository: Repository<MerchantVerificationReview>,
  ) {}

  async listPending() {
    const rows = await this.merchantInviteRepository.find({
      where: { overall_onboarding_status: OverallOnboardingStatus.MAKER_SUBMITTED },
      order: { maker_submitted_at: 'DESC' },
    });

    return {
      total: rows.length,
      merchants: rows.map((invite) => this.toQueueItem(invite)),
    };
  }

  async getReview(clientId: string) {
    const invite = await this.requireInvite(clientId);
    const merchant =
      await this.merchantContextService.findMerchantByClientId(clientId);

    const [directors, authorizers, bankDetails, documents, reviews] =
      await Promise.all([
        this.directorRepository.find({
          where: { client_id: clientId, status: 'active' },
          order: { created_at: 'ASC' },
        }),
        this.authorizerRepository.find({
          where: { client_id: clientId, status: 'active' },
          order: { created_at: 'ASC' },
        }),
        this.bankDetailRepository.find({
          where: { client_id: clientId, status: 'active' },
          order: { created_at: 'ASC' },
        }),
        this.documentRepository.find({
          where: { client_id: clientId },
          order: { created_at: 'DESC' },
        }),
        this.reviewRepository.find({
          where: { client_id: clientId },
          order: { created_at: 'DESC' },
        }),
      ]);

    const latestDocuments = this.latestDocuments(documents);

    return {
      clientId,
      invite: this.toQueueItem(invite),
      merchant: {
        clientId: merchant.client_id,
        gstin: merchant.gstin,
        cin: merchant.cin,
        legalName: merchant.legal_name,
        tradeName: merchant.trade_name,
        status: merchant.status,
        verificationStatus: merchant.verification_status,
        onboardingType: merchant.onboarding_type,
        merchantProfile: merchant.merchant_profile,
        selectedMerchantProfile: merchant.selected_merchant_profile,
      },
      sections: invite.section_statuses ?? {},
      directors: directors.map(toPersonResponse),
      authorizers: authorizers.map(toPersonResponse),
      bankDetails: bankDetails.map(toBankDetailResponse),
      documents: latestDocuments.map((doc) => this.toDocumentResponse(doc)),
      reviews: reviews.map((review) => this.toReviewResponse(review)),
      canApprove: this.canApprove(invite, latestDocuments),
    };
  }

  async reviewSection(payload: AdminSectionReviewPayloadDto) {
    const invite = await this.requireSubmittedInvite(payload.clientId);
    const current = this.sectionStatus(invite, payload.section);

    if (
      current !== OnboardingSectionStatus.VERIFICATION_PENDING &&
      current !== OnboardingSectionStatus.REJECTED &&
      current !== OnboardingSectionStatus.VERIFIED
    ) {
      throw new BadRequestException(
        `Section ${payload.section} has not been submitted for review`,
      );
    }

    const nextStatus =
      payload.decision === VerificationDecision.APPROVED
        ? OnboardingSectionStatus.VERIFIED
        : OnboardingSectionStatus.REJECTED;

    invite.section_statuses = {
      ...(invite.section_statuses ?? {}),
      [payload.section]: nextStatus,
    };
    await this.merchantInviteRepository.save(invite);

    if (
      payload.section === OnboardingSectionKey.DOCUMENTS &&
      payload.decision === VerificationDecision.APPROVED
    ) {
      await this.approveLatestRequiredDocuments(invite);
    }

    const review = await this.saveReview({
      clientId: payload.clientId,
      reviewerUserId: payload.reviewerUserId,
      targetType: VerificationTargetType.SECTION,
      targetKey: payload.section,
      decision: payload.decision,
      remarks: payload.remarks,
    });

    await this.auditService.log({
      event: MerchantAuditEvent.MERCHANT_SECTION_REVIEWED,
      action: 'UPDATE',
      resource: 'merchant_invites',
      description: `Admin ${payload.decision} section ${payload.section} for clientId ${payload.clientId}`,
      targetId: invite.id,
      metadata: {
        client_id: payload.clientId,
        section: payload.section,
        decision: payload.decision,
        reviewer_user_id: payload.reviewerUserId,
      },
    });

    return {
      message: `Section ${payload.section} ${payload.decision}`,
      clientId: payload.clientId,
      section: payload.section,
      sectionStatus: nextStatus,
      sections: invite.section_statuses,
      review: this.toReviewResponse(review),
    };
  }

  async reviewDocument(payload: AdminDocumentReviewPayloadDto) {
    await this.requireSubmittedInvite(payload.clientId);

    const document = await this.documentRepository.findOne({
      where: { id: payload.documentId, client_id: payload.clientId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.status =
      payload.decision === VerificationDecision.APPROVED
        ? MERCHANT_DOCUMENT_STATUS.APPROVED
        : MERCHANT_DOCUMENT_STATUS.REJECTED;
    const saved = await this.documentRepository.save(document);

    const review = await this.saveReview({
      clientId: payload.clientId,
      reviewerUserId: payload.reviewerUserId,
      targetType: VerificationTargetType.DOCUMENT,
      targetKey: payload.documentId,
      decision: payload.decision,
      remarks: payload.remarks,
    });

    await this.auditService.log({
      event: MerchantAuditEvent.MERCHANT_DOCUMENT_REVIEWED,
      action: 'UPDATE',
      resource: 'merchant_documents',
      description: `Admin ${payload.decision} document ${saved.document_type} for clientId ${payload.clientId}`,
      targetId: saved.id,
      metadata: {
        client_id: payload.clientId,
        document_id: saved.id,
        document_type: saved.document_type,
        decision: payload.decision,
        reviewer_user_id: payload.reviewerUserId,
      },
    });

    return {
      message: `Document ${saved.document_type} ${payload.decision}`,
      clientId: payload.clientId,
      document: this.toDocumentResponse(saved),
      review: this.toReviewResponse(review),
    };
  }

  async submitApproval(payload: AdminOverallApprovalPayloadDto) {
    const invite = await this.requireSubmittedInvite(payload.clientId);
    const merchant =
      await this.merchantContextService.findMerchantByClientId(payload.clientId);

    if (payload.decision === VerificationDecision.APPROVED) {
      if (
        this.sectionStatus(invite, OnboardingSectionKey.DOCUMENTS) ===
        OnboardingSectionStatus.VERIFIED
      ) {
        await this.approveLatestRequiredDocuments(invite);
      }

      const documentsAfterSync = await this.documentRepository.find({
        where: { client_id: payload.clientId },
        order: { created_at: 'DESC' },
      });
      const latestAfterSync = this.latestDocuments(documentsAfterSync);
      const blockers = this.approvalBlockers(invite, latestAfterSync);

      if (blockers.length) {
        throw new BadRequestException({
          statusCode: 400,
          message: `Cannot approve yet. Pending: ${blockers.join(', ')}`,
          error: 'Bad Request',
          errors: blockers.map((item) => ({
            field: item,
            message: `${item} must be approved before final approval`,
          })),
        });
      }

      invite.list_status = MerchantInviteListStatus.COMPLETED;
      invite.overall_onboarding_status = OverallOnboardingStatus.COMPLETED;
      invite.completed_at = invite.completed_at ?? new Date();
      merchant.status = 'active';
      merchant.verification_status = 'verified';
    } else {
      invite.overall_onboarding_status = OverallOnboardingStatus.REJECTED;
      merchant.verification_status = 'rejected';
    }

    invite.checker_user_id = payload.reviewerUserId;
    invite.checker_decision = payload.decision;
    invite.checker_remarks = payload.remarks ?? null;
    invite.checker_reviewed_at = new Date();

    await this.merchantInviteRepository.save(invite);
    await this.merchantRepository.save(merchant);

    const review = await this.saveReview({
      clientId: payload.clientId,
      reviewerUserId: payload.reviewerUserId,
      targetType: VerificationTargetType.OVERALL,
      targetKey: 'onboarding',
      decision: payload.decision,
      remarks: payload.remarks,
    });

    await this.auditService.log({
      event:
        payload.decision === VerificationDecision.APPROVED
          ? MerchantAuditEvent.MERCHANT_ONBOARDING_CHECKER_APPROVED
          : MerchantAuditEvent.MERCHANT_ONBOARDING_CHECKER_REJECTED,
      action: 'UPDATE',
      resource: 'merchant_invites',
      description: `Admin ${payload.decision} onboarding for clientId ${payload.clientId}`,
      targetId: invite.id,
      metadata: {
        client_id: payload.clientId,
        decision: payload.decision,
        reviewer_user_id: payload.reviewerUserId,
      },
    });

    if (payload.decision === VerificationDecision.APPROVED) {
      await this.merchantInviteService.refreshProgress(payload.clientId);
    }

    return {
      message:
        payload.decision === VerificationDecision.APPROVED
          ? 'Merchant onboarding approved'
          : 'Merchant onboarding rejected',
      clientId: payload.clientId,
      overallOnboardingStatus: invite.overall_onboarding_status,
      checkerDecision: invite.checker_decision,
      checkerRemarks: invite.checker_remarks,
      checkerReviewedAt: invite.checker_reviewed_at,
      sections: invite.section_statuses,
      review: this.toReviewResponse(review),
    };
  }

  private async requireInvite(clientId: string): Promise<MerchantInvite> {
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

  private async requireSubmittedInvite(clientId: string): Promise<MerchantInvite> {
    const invite = await this.requireInvite(clientId);

    if (invite.overall_onboarding_status !== OverallOnboardingStatus.MAKER_SUBMITTED) {
      throw new BadRequestException(
        'Merchant onboarding is not pending admin verification',
      );
    }

    return invite;
  }

  private sectionStatus(
    invite: MerchantInvite,
    section: OnboardingSectionKey,
  ): string {
    return invite.section_statuses?.[section] ?? OnboardingSectionStatus.NOT_STARTED;
  }

  private requiredDocumentTypes(invite: MerchantInvite): string[] {
    if (invite.onboarding_type === OnboardingType.WITHOUT_GST) {
      return REQUIRED_DOCUMENT_TYPES.filter((type) => type !== 'GST');
    }
    return [...REQUIRED_DOCUMENT_TYPES];
  }

  private async approveLatestRequiredDocuments(
    invite: MerchantInvite,
  ): Promise<void> {
    if (!invite.client_id) {
      return;
    }

    const documents = await this.documentRepository.find({
      where: { client_id: invite.client_id },
      order: { created_at: 'DESC' },
    });
    const required = new Set(this.requiredDocumentTypes(invite));
    const latest = this.latestDocuments(documents).filter((document) =>
      required.has(document.document_type),
    );

    for (const document of latest) {
      if (document.status !== MERCHANT_DOCUMENT_STATUS.APPROVED) {
        document.status = MERCHANT_DOCUMENT_STATUS.APPROVED;
        await this.documentRepository.save(document);
      }
    }
  }

  private canApprove(
    invite: MerchantInvite,
    documents: MerchantDocument[],
  ): boolean {
    return this.approvalBlockers(invite, documents).length === 0;
  }

  private approvalBlockers(
    invite: MerchantInvite,
    documents: MerchantDocument[],
  ): string[] {
    const missingSections = ONBOARDING_SECTIONS.filter(
      (section) =>
        this.sectionStatus(invite, section) !== OnboardingSectionStatus.VERIFIED,
    );

    const missingDocuments = this.requiredDocumentTypes(invite).filter(
      (type) =>
        !documents.some(
          (doc) =>
            doc.document_type === type &&
            doc.status === MERCHANT_DOCUMENT_STATUS.APPROVED,
        ),
    );

    return [...missingSections, ...missingDocuments];
  }

  private latestDocuments(documents: MerchantDocument[]): MerchantDocument[] {
    const latestByType = new Map<string, MerchantDocument>();
    for (const document of documents) {
      if (!latestByType.has(document.document_type)) {
        latestByType.set(document.document_type, document);
      }
    }
    return Array.from(latestByType.values());
  }

  private async saveReview(input: {
    clientId: string;
    reviewerUserId: string;
    targetType: VerificationTargetType;
    targetKey: string;
    decision: VerificationDecision;
    remarks?: string | null;
  }) {
    const review = this.reviewRepository.create({
      client_id: input.clientId,
      reviewer_user_id: input.reviewerUserId,
      target_type: input.targetType,
      target_key: input.targetKey,
      decision: input.decision,
      remarks: input.remarks ?? null,
    });
    return this.reviewRepository.save(review);
  }

  private toQueueItem(invite: MerchantInvite) {
    return {
      id: invite.id,
      userId: invite.user_id,
      clientId: invite.client_id,
      companyName: invite.company_name,
      firstName: invite.first_name,
      lastName: invite.last_name,
      mobile: invite.mobile,
      email: invite.email,
      overallOnboardingStatus: invite.overall_onboarding_status,
      makerSubmittedAt: invite.maker_submitted_at,
      checkerDecision: invite.checker_decision,
      checkerRemarks: invite.checker_remarks,
      checkerReviewedAt: invite.checker_reviewed_at,
      sections: invite.section_statuses ?? {},
    };
  }

  private toDocumentResponse(document: MerchantDocument) {
    return {
      id: document.id,
      clientId: document.client_id,
      documentType: document.document_type,
      fileUrl: document.file_url,
      fileName: document.file_name,
      mimeType: document.mime_type,
      status: document.status,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
    };
  }

  private toReviewResponse(review: MerchantVerificationReview) {
    return {
      id: review.id,
      clientId: review.client_id,
      reviewerUserId: review.reviewer_user_id,
      targetType: review.target_type,
      targetKey: review.target_key,
      decision: review.decision,
      remarks: review.remarks,
      createdAt: review.created_at,
    };
  }
}

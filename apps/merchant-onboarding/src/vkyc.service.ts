import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { MerchantAuditEvent } from './constants/audit-event.constants';
import {
  toUiVideoKycStatus,
  toVkycAdminStatus,
  VKYC_ADMIN_REJECTED_STATUS,
  VKYC_ADMIN_VERIFIED_STATUS,
  VKYC_PROVIDER_PENDING_STATUS,
  VkycAdminDecision,
  VkycPersonType,
  VkycReviewType,
} from './constants/vkyc.constants';
import {
  VkycAdminReviewPayloadDto,
  VkycPersonPayloadDto,
  VkycUpdateSessionPayloadDto,
  VkycWebhookPayloadDto,
} from './dto/vkyc.dto';
import { AuthorizedSignatory } from './entities/authorized-signatory.entity';
import { Director } from './entities/director.entity';
import { MerchantInviteService } from './merchant-invite.service';

type VkycPerson = Director | AuthorizedSignatory;

@Injectable()
export class VkycService {
  private readonly logger = new Logger(VkycService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly merchantInviteService: MerchantInviteService,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(AuthorizedSignatory)
    private readonly authorizerRepository: Repository<AuthorizedSignatory>,
  ) {}

  async assertPerson(payload: VkycPersonPayloadDto) {
    const person = await this.requirePersonForMerchant(
      payload.personId,
      payload.type,
      payload.userId,
    );

    return {
      id: person.id,
      clientId: person.client_id,
      type: payload.type,
      fullName: person.full_name,
      sessionId: person.session_id,
      videoKycStatus: person.video_kyc_status,
    };
  }

  async updateSession(payload: VkycUpdateSessionPayloadDto) {
    const person = await this.requirePersonForMerchant(
      payload.personId,
      payload.type,
      payload.userId,
    );

    person.session_id = payload.sessionId;
    person.video_kyc_status = VKYC_PROVIDER_PENDING_STATUS;
    person.vkyc_rejection_reason = null;

    const saved = await this.savePerson(payload.type, person);

    await this.auditService.log({
      event: MerchantAuditEvent.VKYC_SESSION_INITIATED,
      action: 'UPDATE',
      resource: this.resourceName(payload.type),
      description: `VKYC session initiated for ${payload.type} ${saved.full_name ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields: ['session_id', 'video_kyc_status'],
      newValues: {
        sessionId: saved.session_id,
        videoKycStatus: saved.video_kyc_status,
      },
      metadata: { client_id: saved.client_id, type: payload.type },
    });

    await this.merchantInviteService.refreshProgress(saved.client_id);

    return {
      message: 'VKYC session stored',
      person: this.toMerchantListItem(saved, payload.type),
    };
  }

  async applyWebhook(payload: VkycWebhookPayloadDto & Record<string, unknown>) {
    const sessionId = String(
      payload.session_id ?? payload.sessionId ?? '',
    ).trim();
    if (!sessionId) {
      throw new BadRequestException('session_id is required');
    }

    const status = String(payload.status ?? '').trim() || null;
    const videoUrl = this.asString(payload.video_url ?? payload.videoUrl);
    const faceVideoUrl = this.asString(
      payload.face_video_url ?? payload.faceVideoUrl,
    );
    const ocrData = this.asRecord(payload.ocr_data);
    const metadata = this.asRecord(payload.metadata);
    const photoUrls = this.extractPhotoUrls(ocrData);

    const directors = await this.directorRepository.find({
      where: { session_id: sessionId },
    });
    const authorizers = await this.authorizerRepository.find({
      where: { session_id: sessionId },
    });
    const matches: Array<{ type: VkycPersonType; person: VkycPerson }> = [
      ...directors.map((person) => ({
        type: VkycPersonType.DIRECTOR,
        person,
      })),
      ...authorizers.map((person) => ({
        type: VkycPersonType.AUTHORIZER,
        person,
      })),
    ];

    if (!matches.length) {
      this.logger.warn(`VKYC webhook session_id not found: ${sessionId}`);
      return { updated: false, sessionId, matched: 0 };
    }

    const clientIds = new Set<string>();

    for (const match of matches) {
      match.person.video_kyc_status = status;
      match.person.video_kyc_url = videoUrl ?? match.person.video_kyc_url;
      match.person.face_video_url =
        faceVideoUrl ?? match.person.face_video_url;
      match.person.aadhaar_photo_url =
        photoUrls.aadhaarPhotoUrl ?? match.person.aadhaar_photo_url;
      match.person.pan_photo_url =
        photoUrls.panPhotoUrl ?? match.person.pan_photo_url;
      match.person.video_kyc_response = payload as Record<string, unknown>;
      match.person.video_kyc_metadata = metadata;
      match.person.vkyc_rejection_reason = null;

      await this.savePerson(match.type, match.person);
      clientIds.add(match.person.client_id);

      await this.auditService.log({
        event: MerchantAuditEvent.VKYC_WEBHOOK_RECEIVED,
        action: 'UPDATE',
        resource: this.resourceName(match.type),
        description: `VKYC webhook applied for ${match.type} ${match.person.full_name ?? match.person.id}`,
        targetId: match.person.id,
        name: match.person.full_name,
        changedFields: [
          'video_kyc_status',
          'video_kyc_url',
          'face_video_url',
          'video_kyc_response',
        ],
        newValues: {
          videoKycStatus: match.person.video_kyc_status,
          videoKycUrl: match.person.video_kyc_url,
        },
        metadata: { client_id: match.person.client_id, sessionId },
      });
    }

    for (const clientId of clientIds) {
      await this.merchantInviteService.refreshProgress(clientId);
    }

    return {
      updated: true,
      sessionId,
      matched: matches.length,
      status,
    };
  }

  async listByUserId(userId: string) {
    const invite = await this.merchantInviteService.findInviteByUserIdOrMobile(
      userId,
    );
    if (!invite?.client_id) {
      throw new NotFoundException('Onboarding merchant not found for this user');
    }

    return this.listByClientId(invite.client_id, { includeMedia: false });
  }

  async listByClientId(
    clientId: string,
    options: { includeMedia: boolean },
  ) {
    const [directors, authorizers] = await Promise.all([
      this.directorRepository.find({
        where: { client_id: clientId, status: 'active' },
        order: { created_at: 'ASC' },
      }),
      this.authorizerRepository.find({
        where: { client_id: clientId, status: 'active' },
        order: { created_at: 'ASC' },
      }),
    ]);

    const persons = [
      ...directors.map((person) =>
        options.includeMedia
          ? this.toAdminListItem(person, VkycPersonType.DIRECTOR)
          : this.toMerchantListItem(person, VkycPersonType.DIRECTOR),
      ),
      ...authorizers.map((person) =>
        options.includeMedia
          ? this.toAdminListItem(person, VkycPersonType.AUTHORIZER)
          : this.toMerchantListItem(person, VkycPersonType.AUTHORIZER),
      ),
    ];

    return { clientId, total: persons.length, persons };
  }

  async adminReview(payload: VkycAdminReviewPayloadDto) {
    const person = await this.requirePersonById(
      payload.personId,
      payload.personType,
    );

    if (payload.type === VkycReviewType.VKYC) {
      return this.reviewVkyc(person, payload);
    }

    return this.reviewIdentity(person, payload);
  }

  private async reviewVkyc(
    person: VkycPerson,
    payload: VkycAdminReviewPayloadDto,
  ) {
    if (payload.decision === VkycAdminDecision.APPROVE) {
      person.is_vkyc_verified = true;
      person.video_kyc_status = VKYC_ADMIN_VERIFIED_STATUS;
      person.vkyc_rejection_reason = null;
    } else {
      if (!payload.reason) {
        throw new BadRequestException('reason is required when rejecting VKYC');
      }
      person.is_vkyc_verified = false;
      person.video_kyc_status = VKYC_ADMIN_REJECTED_STATUS;
      person.vkyc_rejection_reason = payload.reason;
    }

    const saved = await this.savePerson(payload.personType, person);
    await this.merchantInviteService.refreshProgress(saved.client_id);

    await this.auditService.log({
      event:
        payload.decision === VkycAdminDecision.APPROVE
          ? MerchantAuditEvent.VKYC_ADMIN_APPROVED
          : MerchantAuditEvent.VKYC_ADMIN_REJECTED,
      action: 'UPDATE',
      resource: this.resourceName(payload.personType),
      description: `VKYC ${payload.decision} for ${payload.personType} ${saved.full_name ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields: [
        'is_vkyc_verified',
        'video_kyc_status',
        'vkyc_rejection_reason',
      ],
      newValues: this.toAdminListItem(saved, payload.personType),
      metadata: {
        client_id: saved.client_id,
        reviewerUserId: payload.reviewerUserId,
      },
    });

    return {
      message: `VKYC ${payload.decision}d`,
      person: this.toAdminListItem(saved, payload.personType),
    };
  }

  private async reviewIdentity(
    person: VkycPerson,
    payload: VkycAdminReviewPayloadDto,
  ) {
    if (payload.decision === VkycAdminDecision.APPROVE) {
      person.is_verified = true;
      person.rejection_reason = null;
    } else {
      if (!payload.reason) {
        throw new BadRequestException(
          'reason is required when rejecting verification',
        );
      }
      person.is_verified = false;
      person.rejection_reason = payload.reason;
    }

    const saved = await this.savePerson(payload.personType, person);

    await this.auditService.log({
      event:
        payload.decision === VkycAdminDecision.APPROVE
          ? MerchantAuditEvent.PERSON_VERIFICATION_APPROVED
          : MerchantAuditEvent.PERSON_VERIFICATION_REJECTED,
      action: 'UPDATE',
      resource: this.resourceName(payload.personType),
      description: `Identity ${payload.decision} for ${payload.personType} ${saved.full_name ?? saved.id}`,
      targetId: saved.id,
      name: saved.full_name,
      changedFields: ['is_verified', 'rejection_reason'],
      newValues: {
        isVerified: saved.is_verified,
        rejectionReason: saved.rejection_reason,
      },
      metadata: {
        client_id: saved.client_id,
        reviewerUserId: payload.reviewerUserId,
      },
    });

    return {
      message: `Verification ${payload.decision}d`,
      person: this.toAdminListItem(saved, payload.personType),
    };
  }

  private async requirePersonForMerchant(
    personId: string,
    type: VkycPersonType,
    userId?: string,
  ): Promise<VkycPerson> {
    const person = await this.requirePersonById(personId, type);

    if (!userId) {
      return person;
    }

    const invite = await this.merchantInviteService.findInviteByUserIdOrMobile(
      userId,
    );
    if (!invite?.client_id) {
      throw new NotFoundException('Onboarding merchant not found for this user');
    }
    if (person.client_id !== invite.client_id) {
      throw new NotFoundException(
        `${type} not found for the authenticated merchant`,
      );
    }

    return person;
  }

  private async requirePersonById(
    personId: string,
    type: VkycPersonType,
  ): Promise<VkycPerson> {
    const repo = this.repo(type);
    const person = await repo.findOne({ where: { id: personId } });
    if (!person || person.status === 'deleted') {
      throw new NotFoundException(`${type} not found for id ${personId}`);
    }
    return person;
  }

  private repo(type: VkycPersonType) {
    return type === VkycPersonType.DIRECTOR
      ? this.directorRepository
      : this.authorizerRepository;
  }

  private async savePerson(type: VkycPersonType, person: VkycPerson) {
    if (type === VkycPersonType.DIRECTOR) {
      return this.directorRepository.save(person as Director);
    }
    return this.authorizerRepository.save(person as AuthorizedSignatory);
  }

  private resourceName(type: VkycPersonType) {
    return type === VkycPersonType.DIRECTOR
      ? 'directors'
      : 'authorized_signatory_details';
  }

  private toMerchantListItem(person: VkycPerson, type: VkycPersonType) {
    const ocrData = this.asRecord(person.video_kyc_response?.ocr_data);
    return {
      id: person.id,
      clientId: person.client_id,
      type,
      name: person.full_name,
      sessionId: person.session_id,
      videoKycStatus: toUiVideoKycStatus(person.video_kyc_status),
      providerStatus: person.video_kyc_status,
      adminStatus: toVkycAdminStatus(person),
      isVkycVerified: person.is_vkyc_verified,
      aadhaar: ocrData,
      pan: this.pickPanJson(ocrData),
      vkyc: person.video_kyc_response,
    };
  }

  private toAdminListItem(person: VkycPerson, type: VkycPersonType) {
    return {
      ...this.toMerchantListItem(person, type),
      firstName: person.first_name,
      lastName: person.last_name,
      din: person.din,
      panNumber: person.pan,
      isVerified: person.is_verified,
      rejectionReason: person.rejection_reason,
      videoKycUrl: person.video_kyc_url,
      faceVideoUrl: person.face_video_url,
      aadhaarPhotoUrl: person.aadhaar_photo_url,
      panPhotoUrl: person.pan_photo_url,
      vkycRejectionReason: person.vkyc_rejection_reason,
      videoKycResponse: this.stripOcrRawText(person.video_kyc_response),
      videoKycMetadata: person.video_kyc_metadata,
    };
  }

  private stripOcrRawText(
    response: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!response) {
      return null;
    }

    const clone = structuredClone(response);
    const ocrData = this.asRecord(clone.ocr_data);
    if (ocrData && 'raw_text' in ocrData) {
      delete ocrData.raw_text;
      clone.ocr_data = ocrData;
    }
    return clone;
  }

  private extractPhotoUrls(ocrData: Record<string, unknown> | null) {
    const aadhaar = this.asRecord(ocrData?.aadhaar);
    const pan = this.asRecord(ocrData?.pan);
    return {
      aadhaarPhotoUrl: this.asString(
        ocrData?.aadhaar_photo_url ??
          ocrData?.aadhaarPhotoUrl ??
          aadhaar?.photo_url ??
          aadhaar?.photoUrl,
      ),
      panPhotoUrl: this.asString(
        ocrData?.pan_photo_url ??
          ocrData?.panPhotoUrl ??
          pan?.photo_url ??
          pan?.photoUrl,
      ),
    };
  }

  private pickPanJson(ocrData: Record<string, unknown> | null) {
    return this.asRecord(ocrData?.pan) ?? ocrData;
  }

  private asString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const text = String(value).trim();
    return text || null;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import {
  MerchantInviteListStatus,
  isPersonVideoKycComplete,
} from './constants/merchant-invite-status.constants';
import { SendInviteDto } from './dto/send-invite.dto';
import { AuthorizedSignatory } from './entities/authorized-signatory.entity';
import { BankDetail } from './entities/bank-detail.entity';
import { Director } from './entities/director.entity';
import { MerchantDocument } from './entities/merchant-document.entity';
import { MerchantInvite } from './entities/merchant-invite.entity';
import { Merchant } from './entities/merchant.entity';

type UserAuthRow = {
  is_active: number;
  must_change_password: boolean;
};

export type OnboardingProgress = {
  merchant_details: boolean;
  directors: boolean;
  authorizers: boolean;
  bank_details: boolean;
  documents: boolean;
  video_kyc: boolean;
  password_set: boolean;
};

export type MerchantInviteListItem = {
  id: string;
  userId: string;
  clientId: string | null;
  company_name: string;
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  business_website: string | null;
  company_type: string | null;
  listStatus: string;
  invitedAt: Date;
  completedAt: Date | null;
  passwordSet: boolean;
  onboardingProgress: OnboardingProgress;
  onboardingType: string | null;
  overallOnboardingStatus: string;
  makerSubmittedAt: Date | null;
  sectionStatuses: Record<string, string>;
};

@Injectable()
export class MerchantInviteService {
  private readonly logger = new Logger(MerchantInviteService.name);

  constructor(
    private readonly dataSource: DataSource,
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

  async createFromSendInvite(
    body: SendInviteDto,
    user: Record<string, unknown>,
  ): Promise<MerchantInvite> {
    return this.ensureInviteForUser({
      userId: String(user.id ?? ''),
      company_name: body.company_name,
      first_name: body.first_name,
      last_name: body.last_name,
      mobile: body.mobile.trim(),
      email: body.email.toLowerCase().trim(),
      business_website: body.business_website ?? null,
      company_type: body.company_type ?? null,
    });
  }

  async ensureInviteForUser(input: {
    userId: string;
    company_name: string;
    first_name: string;
    last_name: string;
    mobile: string;
    email: string;
    business_website: string | null;
    company_type: string | null;
  }): Promise<MerchantInvite> {
    if (!input.userId) {
      throw new Error('userId is required to create merchant invite');
    }

    const existing = await this.merchantInviteRepository.findOne({
      where: { user_id: input.userId },
    });

    if (existing) {
      return existing;
    }

    const invite = this.merchantInviteRepository.create({
      user_id: input.userId,
      client_id: null,
      company_name: input.company_name,
      first_name: input.first_name,
      last_name: input.last_name,
      mobile: input.mobile,
      email: input.email,
      business_website: input.business_website,
      company_type: input.company_type,
      list_status: MerchantInviteListStatus.INVITED,
      merchant_details_completed: false,
      directors_completed: false,
      authorizers_completed: false,
      bank_details_completed: false,
      video_kyc_completed: false,
      completed_at: null,
    });

    return this.merchantInviteRepository.save(invite);
  }

  async syncMissingInvitesFromUsers(): Promise<number> {
    type MerchantUserRow = {
      id: string;
      company_name: string;
      first_name: string;
      last_name: string;
      mobile: string;
      email: string;
      business_website: string | null;
      company_type: string | null;
    };

    const rows = await this.dataSource.query<MerchantUserRow[]>(
      `SELECT u.id, u.company_name, u.first_name, u.last_name, u.mobile, u.email,
              u.business_website, u.company_type
       FROM users u
       WHERE u.role = 'merchant'
         AND NOT EXISTS (
           SELECT 1 FROM merchant_invites mi WHERE mi.user_id = u.id
         )`,
    );

    for (const row of rows) {
      await this.ensureInviteForUser({
        userId: row.id,
        company_name: row.company_name,
        first_name: row.first_name,
        last_name: row.last_name,
        mobile: row.mobile,
        email: row.email,
        business_website: row.business_website,
        company_type: row.company_type,
      });
    }

    if (rows.length) {
      this.logger.log(
        `Backfilled ${rows.length} merchant invite record(s) from users table`,
      );
    }

    return rows.length;
  }

  async linkClientId(userId: string, clientId: string): Promise<void> {
    const invite = await this.findInviteByUserId(userId);

    if (!invite) {
      this.logger.warn(
        `No merchant invite found for userId=${userId} while linking clientId=${clientId}`,
      );
      return;
    }

    invite.client_id = clientId;
    await this.merchantInviteRepository.save(invite);
    await this.refreshProgress(clientId);
  }

  async linkClientIdByMobile(mobile: string, clientId: string): Promise<void> {
    const invite = await this.merchantInviteRepository.findOne({
      where: { mobile: mobile.trim() },
      order: { invited_at: 'DESC' },
    });

    if (!invite) {
      return;
    }

    invite.client_id = clientId;
    await this.merchantInviteRepository.save(invite);
    await this.refreshProgress(clientId);
  }

  async refreshProgress(clientId: string): Promise<MerchantInvite | null> {
    const invite = await this.merchantInviteRepository.findOne({
      where: { client_id: clientId },
    });

    if (!invite) {
      return invite;
    }

    const progress = await this.evaluateProgress(clientId);
    invite.merchant_details_completed = progress.merchant_details;
    invite.directors_completed = progress.directors;
    invite.authorizers_completed = progress.authorizers;
    invite.bank_details_completed = progress.bank_details;
    invite.video_kyc_completed = progress.video_kyc;

    return this.merchantInviteRepository.save(invite);
  }

  async listInvitedMerchants(): Promise<{
    merchants: MerchantInviteListItem[];
    total: number;
  }> {
    await this.syncMissingInvitesFromUsers();

    const rows = await this.merchantInviteRepository.find({
      where: { list_status: MerchantInviteListStatus.INVITED },
      order: { invited_at: 'DESC' },
    });

    const merchants = await Promise.all(
      rows.map((row) => this.toListItem(row)),
    );

    return { merchants, total: merchants.length };
  }

  async listOnboardedMerchants() {
    return this.listMerchantsByVerification([
      'verification_pending',
      'verified',
    ]);
  }

  async listCompletedMerchants() {
    return this.listMerchantsByVerification(['verified']);
  }

  private async listMerchantsByVerification(statuses: string[]) {
    const merchants = await this.merchantRepository.find({
      where: {
        verification_status: In(statuses),
        status: Not('deleted'),
      },
      order: { updated_at: 'DESC' },
    });

    const clientIds = merchants.map((merchant) => merchant.client_id);

    const invites = clientIds.length
      ? await this.merchantInviteRepository.find({
          where: { client_id: In(clientIds) },
        })
      : [];

    const inviteByClientId = new Map(
      invites
        .filter((invite) => invite.client_id)
        .map((invite) => [invite.client_id as string, invite]),
    );

    const items = await Promise.all(
      merchants.map(async (merchant) => {
        const invite = inviteByClientId.get(merchant.client_id);
        const base = invite
          ? await this.toListItem(invite)
          : {
              id: merchant.id,
              userId: '',
              clientId: merchant.client_id,
              company_name: merchant.legal_name || merchant.trade_name || '',
              first_name: '',
              last_name: '',
              mobile: '',
              email: '',
              business_website: null,
              company_type: null,
              listStatus: MerchantInviteListStatus.COMPLETED,
              invitedAt: merchant.created_at,
              completedAt: merchant.updated_at,
              passwordSet: true,
              onboardingProgress: {
                merchant_details: true,
                directors: true,
                authorizers: true,
                bank_details: true,
                documents: true,
                video_kyc: true,
                password_set: true,
              },
              onboardingType: merchant.onboarding_type,
              overallOnboardingStatus: 'completed',
              makerSubmittedAt: merchant.updated_at,
              sectionStatuses: {},
            };

        return {
          ...base,
          clientId: merchant.client_id,
          company_name:
            merchant.legal_name ||
            merchant.trade_name ||
            base.company_name,
          gstin: merchant.gstin,
          cin: merchant.cin,
          legalName: merchant.legal_name,
          tradeName: merchant.trade_name,
          status: merchant.status,
          verificationStatus: merchant.verification_status,
          onboardingType: merchant.onboarding_type ?? base.onboardingType,
          completedAt: base.completedAt,
          completed_at: base.completedAt,
          spocName: `${base.first_name} ${base.last_name}`.trim(),
        };
      }),
    );

    return { merchants: items, total: items.length };
  }

  async refreshProgressByUserId(
    userId: string,
  ): Promise<{ refreshed: boolean }> {
    const invite = await this.findInviteByUserId(userId);

    if (!invite?.client_id) {
      return { refreshed: false };
    }

    await this.refreshProgress(invite.client_id);
    return { refreshed: true };
  }

  async findInviteByUserIdOrMobile(
    userId?: string,
    mobile?: string,
  ): Promise<MerchantInvite | null> {
    if (userId) {
      const byUser = await this.findInviteByUserId(userId);
      if (byUser) {
        return byUser;
      }
    }

    if (mobile) {
      return this.merchantInviteRepository.findOne({
        where: { mobile: mobile.trim() },
        order: { invited_at: 'DESC' },
      });
    }

    return null;
  }

  private async findInviteByUserId(
    userId: string,
  ): Promise<MerchantInvite | null> {
    return this.merchantInviteRepository.findOne({
      where: { user_id: userId },
    });
  }

  private async evaluateProgress(clientId: string): Promise<OnboardingProgress> {
    const merchant = await this.merchantRepository.findOne({
      where: { client_id: clientId },
    });

    const merchantDetails =
      !!merchant && merchant.status !== 'deleted';

    const directors = await this.directorRepository.find({
      where: { client_id: clientId, status: 'active' },
    });

    const authorizers = await this.authorizedSignatoryRepository.find({
      where: { client_id: clientId, status: 'active' },
    });

    const bankDetails = await this.bankDetailRepository.find({
      where: { client_id: clientId, status: 'active' },
    });

    const documentCount = await this.documentRepository.count({
      where: { client_id: clientId },
    });

    const directorsComplete = directors.length > 0;
    const authorizersComplete = authorizers.length > 0;
    const bankDetailsComplete = bankDetails.length > 0;
    const documentsComplete = documentCount > 0;

    const allPeople = [...directors, ...authorizers];
    const videoKycComplete =
      allPeople.length > 0 && allPeople.some(isPersonVideoKycComplete);

    const invite = await this.merchantInviteRepository.findOne({
      where: { client_id: clientId },
    });

    const passwordSet = invite
      ? await this.isPasswordSet(invite.user_id)
      : false;

    return {
      merchant_details: merchantDetails,
      directors: directorsComplete,
      authorizers: authorizersComplete,
      bank_details: bankDetailsComplete,
      documents: documentsComplete,
      video_kyc: videoKycComplete,
      password_set: passwordSet,
    };
  }

  private async isPasswordSet(userId: string): Promise<boolean> {
    const rows = await this.dataSource.query<UserAuthRow[]>(
      `SELECT is_active, must_change_password
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );

    const user = rows[0];

    if (!user) {
      return false;
    }

    return user.is_active === 1 && user.must_change_password === false;
  }

  private async toListItem(
    invite: MerchantInvite,
  ): Promise<MerchantInviteListItem> {
    const passwordSet = await this.isPasswordSet(invite.user_id);

    let onboardingProgress: OnboardingProgress = {
      merchant_details: invite.merchant_details_completed,
      directors: invite.directors_completed,
      authorizers: invite.authorizers_completed,
      bank_details: invite.bank_details_completed,
      documents:
        invite.section_statuses?.documents === 'verification_pending' ||
        invite.section_statuses?.documents === 'verified',
      video_kyc: invite.video_kyc_completed,
      password_set: passwordSet,
    };

    if (
      invite.client_id &&
      invite.list_status === MerchantInviteListStatus.INVITED
    ) {
      onboardingProgress = await this.evaluateProgress(invite.client_id);
    } else if (!invite.client_id) {
      onboardingProgress = {
        merchant_details: false,
        directors: false,
        authorizers: false,
        bank_details: false,
        documents: false,
        video_kyc: false,
        password_set: passwordSet,
      };
    }

    return {
      id: invite.id,
      userId: invite.user_id,
      clientId: invite.client_id,
      company_name: invite.company_name,
      first_name: invite.first_name,
      last_name: invite.last_name,
      mobile: invite.mobile,
      email: invite.email,
      business_website: invite.business_website,
      company_type: invite.company_type,
      listStatus: invite.list_status,
      invitedAt: invite.invited_at,
      completedAt: invite.completed_at,
      passwordSet,
      onboardingProgress,
      onboardingType: invite.onboarding_type,
      overallOnboardingStatus: invite.overall_onboarding_status,
      makerSubmittedAt: invite.maker_submitted_at,
      sectionStatuses: invite.section_statuses ?? {},
    };
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { MerchantAuditEvent } from './constants/audit-event.constants';
import {
  CreateBankDetailDto,
  UpdateBankDetailDto,
  VerifyBankDetailDto,
} from './dto/bank-detail.dto';
import { BankDetail } from './entities/bank-detail.entity';
import { KycClientService } from './kyc-client.service';
import { MerchantContextService } from './merchant-context.service';
import { MerchantInviteService } from './merchant-invite.service';
import {
  applyBankDetailUpdate,
  fromCreateBankDetailDto,
  toBankDetailResponse,
} from './mappers/bank-detail.mapper';

@Injectable()
export class BankDetailCrudService {
  constructor(
    private readonly merchantContextService: MerchantContextService,
    private readonly merchantInviteService: MerchantInviteService,
    private readonly kycClientService: KycClientService,
    private readonly auditService: AuditService,
    @InjectRepository(BankDetail)
    private readonly bankDetailRepository: Repository<BankDetail>,
  ) {}

  async list(clientId: string) {
    await this.merchantContextService.findMerchantByClientId(clientId);
    const rows = await this.bankDetailRepository.find({
      where: { client_id: clientId, status: 'active' },
      order: { created_at: 'ASC' },
    });
    return { clientId, bankDetails: rows.map(toBankDetailResponse) };
  }

  async get(clientId: string, id: string) {
    const bank = await this.findActiveBankDetail(clientId, id);
    return toBankDetailResponse(bank);
  }

  async verifyAndCreate(clientId: string, body: VerifyBankDetailDto) {
    await this.merchantContextService.assertMerchantActive(clientId);

    const verificationResponse = await this.kycClientService.verifyBankAccount(
      body.accountNumber,
      body.ifscCode,
    );

    const created = await this.create(clientId, {
      accountNumber: body.accountNumber,
      ifscCode: body.ifscCode,
      isPrimary: body.isPrimary,
      accountType: body.accountType,
      rawVerificationResponse: verificationResponse,
    });

    return {
      ...created,
      verificationResponse,
    };
  }

  async create(clientId: string, body: CreateBankDetailDto) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const bank = this.bankDetailRepository.create(
      fromCreateBankDetailDto(clientId, body),
    );
    const saved = await this.bankDetailRepository.save(bank);

    await this.auditService.log({
      event: MerchantAuditEvent.BANK_DETAIL_CREATED,
      action: 'CREATE',
      resource: 'bank_details',
      description: `Bank detail created for account ${saved.account_number}`,
      targetId: saved.id,
      changedFields: Object.keys(fromCreateBankDetailDto(clientId, body)),
      newValues: toBankDetailResponse(saved),
      metadata: { client_id: clientId },
    });

    await this.merchantInviteService.refreshProgress(clientId);

    return {
      message: 'Bank detail created successfully',
      bankDetail: toBankDetailResponse(saved),
    };
  }

  async update(clientId: string, id: string, body: UpdateBankDetailDto) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const bank = await this.findActiveBankDetail(clientId, id);
    const changedFields = applyBankDetailUpdate(bank, body);

    if (!changedFields.length) {
      throw new BadRequestException('At least one field is required to update');
    }

    const saved = await this.bankDetailRepository.save(bank);

    await this.auditService.log({
      event: MerchantAuditEvent.BANK_DETAIL_UPDATED,
      action: 'UPDATE',
      resource: 'bank_details',
      description: `Bank detail updated for account ${saved.account_number}`,
      targetId: saved.id,
      changedFields,
      newValues: toBankDetailResponse(saved),
      metadata: { client_id: clientId },
    });

    await this.merchantInviteService.refreshProgress(clientId);

    return {
      message: 'Bank detail updated successfully',
      bankDetail: toBankDetailResponse(saved),
    };
  }

  async delete(clientId: string, id: string) {
    await this.merchantContextService.assertMerchantActive(clientId);
    const bank = await this.findActiveBankDetail(clientId, id);

    bank.status = 'deleted';
    const saved = await this.bankDetailRepository.save(bank);

    await this.auditService.log({
      event: MerchantAuditEvent.BANK_DETAIL_DELETED,
      action: 'DELETE',
      resource: 'bank_details',
      description: `Bank detail deleted for account ${saved.account_number}`,
      targetId: saved.id,
      changedFields: ['status'],
      newValues: { status: 'deleted' },
      metadata: { client_id: clientId },
    });

    await this.merchantInviteService.refreshProgress(clientId);

    return {
      message: 'Bank detail deleted successfully',
      id: saved.id,
      status: saved.status,
    };
  }

  private async findActiveBankDetail(
    clientId: string,
    id: string,
  ): Promise<BankDetail> {
    const bank = await this.bankDetailRepository.findOne({
      where: { id, client_id: clientId },
    });
    if (!bank || bank.status === 'deleted') {
      throw new NotFoundException(
        `Bank detail not found for clientId ${clientId} and id ${id}`,
      );
    }
    return bank;
  }
}

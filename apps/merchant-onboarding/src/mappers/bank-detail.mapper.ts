import { BankDetail } from '../entities/bank-detail.entity';
import {
  CreateBankDetailDto,
  UpdateBankDetailDto,
} from '../dto/bank-detail.dto';

export function toBankDetailResponse(bank: BankDetail) {
  return {
    id: bank.id,
    clientId: bank.client_id,
    accountNumber: bank.account_number,
    ifscCode: bank.ifsc_code,
    bankName: bank.bank_name,
    branchName: bank.branch_name,
    accountHolderName: bank.account_holder_name,
    accountType: bank.account_type,
    isPrimary: bank.is_primary,
    isVerified: bank.is_verified,
    verificationStatus: bank.verification_status,
    rawVerificationResponse: bank.raw_verification_response,
    status: bank.status,
    createdAt: bank.created_at,
    updatedAt: bank.updated_at,
  };
}

export function fromCreateBankDetailDto(
  clientId: string,
  body: CreateBankDetailDto,
): Partial<BankDetail> {
  return {
    client_id: clientId,
    account_number: String(body.accountNumber).trim(),
    ifsc_code: String(body.ifscCode).trim().toUpperCase(),
    bank_name: body.bankName ?? null,
    branch_name: body.branchName ?? null,
    account_holder_name: body.accountHolderName ?? null,
    account_type: body.accountType ?? null,
    is_primary: body.isPrimary ?? false,
    is_verified: body.isVerified ?? false,
    verification_status: body.verificationStatus ?? 'pending',
    raw_verification_response: body.rawVerificationResponse ?? null,
    status: body.status ?? 'active',
  };
}

export function applyBankDetailUpdate(
  bank: BankDetail,
  body: UpdateBankDetailDto,
): string[] {
  const changedFields: string[] = [];

  if (body.accountNumber !== undefined) {
    bank.account_number = String(body.accountNumber).trim();
    changedFields.push('account_number');
  }
  if (body.ifscCode !== undefined) {
    bank.ifsc_code = String(body.ifscCode).trim().toUpperCase();
    changedFields.push('ifsc_code');
  }
  if (body.bankName !== undefined) {
    bank.bank_name = body.bankName;
    changedFields.push('bank_name');
  }
  if (body.branchName !== undefined) {
    bank.branch_name = body.branchName;
    changedFields.push('branch_name');
  }
  if (body.accountHolderName !== undefined) {
    bank.account_holder_name = body.accountHolderName;
    changedFields.push('account_holder_name');
  }
  if (body.accountType !== undefined) {
    bank.account_type = body.accountType;
    changedFields.push('account_type');
  }
  if (body.isPrimary !== undefined) {
    bank.is_primary = body.isPrimary;
    changedFields.push('is_primary');
  }
  if (body.isVerified !== undefined) {
    bank.is_verified = body.isVerified;
    changedFields.push('is_verified');
  }
  if (body.verificationStatus !== undefined) {
    bank.verification_status = body.verificationStatus;
    changedFields.push('verification_status');
  }
  if (body.rawVerificationResponse !== undefined) {
    bank.raw_verification_response = body.rawVerificationResponse;
    changedFields.push('raw_verification_response');
  }
  if (body.status !== undefined) {
    bank.status = body.status;
    changedFields.push('status');
  }

  return changedFields;
}

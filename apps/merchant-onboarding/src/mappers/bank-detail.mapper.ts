import { BankDetail } from '../entities/bank-detail.entity';
import {
  CreateBankDetailDto,
  UpdateBankDetailDto,
} from '../dto/bank-detail.dto';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

export function mapBankVerificationPayload(
  raw: Record<string, unknown> | null | undefined,
) {
  const root = asRecord(raw);
  const data = asRecord(root.data);
  const ifscDetails = asRecord(data.ifscDetails);
  const verificationStatus = asString(
    data.verification_status ?? root.verification_status,
  ).toUpperCase();
  const vendorStatus = asString(root.status).toUpperCase();

  return {
    accountNumber: asString(data.account_number) || undefined,
    ifscCode: asString(ifscDetails.ifsc).toUpperCase() || undefined,
    beneficiaryName: asString(data.beneficiary_name) || undefined,
    bankName: asString(ifscDetails.name) || undefined,
    branchName: asString(ifscDetails.branch) || undefined,
    transactionRemark: asString(data.transaction_remark) || undefined,
    isPennyDrop:
      typeof data.is_penny_drop === 'boolean' ? data.is_penny_drop : undefined,
    verificationStatus: verificationStatus || undefined,
    isVerified:
      verificationStatus === 'VERIFIED' || vendorStatus === 'SUCCESS',
    ifscDetails: Object.keys(ifscDetails).length ? ifscDetails : undefined,
  };
}

export function toBankDetailResponse(bank: BankDetail) {
  const raw = bank.raw_verification_response;
  const mapped = mapBankVerificationPayload(raw);
  const ifscDetails = bank.ifsc_details ?? mapped.ifscDetails ?? null;
  const beneficiaryName =
    bank.account_holder_name ?? mapped.beneficiaryName ?? null;

  return {
    id: bank.id,
    clientId: bank.client_id,
    accountNumber: bank.account_number,
    ifscCode: bank.ifsc_code,
    beneficiaryName,
    accountHolderName: beneficiaryName,
    bankName: bank.bank_name,
    branchName: bank.branch_name,
    transactionRemark: bank.transaction_remark,
    isPennyDrop: bank.is_penny_drop,
    verificationStatus: bank.verification_status,
    isVerified: bank.is_verified,
    ifscDetails,
    accountType: bank.account_type,
    isPrimary: bank.is_primary,
    rawVerificationResponse: raw,
    status: bank.status,
    createdAt: bank.created_at,
    updatedAt: bank.updated_at,
  };
}

export function fromCreateBankDetailDto(
  clientId: string,
  body: CreateBankDetailDto,
): Partial<BankDetail> {
  const mapped = mapBankVerificationPayload(body.rawVerificationResponse);
  const beneficiaryName =
    body.beneficiaryName ??
    body.accountHolderName ??
    mapped.beneficiaryName ??
    null;
  const ifscDetails = body.ifscDetails ?? mapped.ifscDetails ?? null;
  const verificationStatus =
    body.verificationStatus ?? mapped.verificationStatus ?? 'pending';

  return {
    client_id: clientId,
    account_number: String(body.accountNumber).trim(),
    ifsc_code: String(body.ifscCode).trim().toUpperCase(),
    bank_name: body.bankName ?? mapped.bankName ?? null,
    branch_name: body.branchName ?? mapped.branchName ?? null,
    account_holder_name: beneficiaryName,
    transaction_remark:
      body.transactionRemark ?? mapped.transactionRemark ?? null,
    is_penny_drop: body.isPennyDrop ?? mapped.isPennyDrop ?? null,
    ifsc_details: ifscDetails,
    account_type: body.accountType ?? null,
    is_primary: body.isPrimary ?? false,
    is_verified: body.isVerified ?? mapped.isVerified ?? false,
    verification_status: verificationStatus,
    raw_verification_response: body.rawVerificationResponse ?? null,
    status: body.status ?? 'active',
  };
}

export function applyBankDetailUpdate(
  bank: BankDetail,
  body: UpdateBankDetailDto,
): string[] {
  const changedFields: string[] = [];
  const mapped = mapBankVerificationPayload(body.rawVerificationResponse);

  if (body.accountNumber !== undefined) {
    bank.account_number = String(body.accountNumber).trim();
    changedFields.push('account_number');
  }
  if (body.ifscCode !== undefined) {
    bank.ifsc_code = String(body.ifscCode).trim().toUpperCase();
    changedFields.push('ifsc_code');
  }
  if (body.bankName !== undefined || mapped.bankName) {
    bank.bank_name = body.bankName ?? mapped.bankName ?? bank.bank_name;
    changedFields.push('bank_name');
  }
  if (body.branchName !== undefined || mapped.branchName) {
    bank.branch_name = body.branchName ?? mapped.branchName ?? bank.branch_name;
    changedFields.push('branch_name');
  }
  if (
    body.accountHolderName !== undefined ||
    body.beneficiaryName !== undefined ||
    mapped.beneficiaryName
  ) {
    bank.account_holder_name =
      body.beneficiaryName ??
      body.accountHolderName ??
      mapped.beneficiaryName ??
      bank.account_holder_name;
    changedFields.push('account_holder_name');
  }
  if (body.transactionRemark !== undefined || mapped.transactionRemark) {
    bank.transaction_remark =
      body.transactionRemark ??
      mapped.transactionRemark ??
      bank.transaction_remark;
    changedFields.push('transaction_remark');
  }
  if (body.isPennyDrop !== undefined || mapped.isPennyDrop !== undefined) {
    bank.is_penny_drop =
      body.isPennyDrop ?? mapped.isPennyDrop ?? bank.is_penny_drop;
    changedFields.push('is_penny_drop');
  }
  if (body.ifscDetails !== undefined || mapped.ifscDetails) {
    bank.ifsc_details =
      body.ifscDetails ?? mapped.ifscDetails ?? bank.ifsc_details;
    changedFields.push('ifsc_details');
  }
  if (body.accountType !== undefined) {
    bank.account_type = body.accountType;
    changedFields.push('account_type');
  }
  if (body.isPrimary !== undefined) {
    bank.is_primary = body.isPrimary;
    changedFields.push('is_primary');
  }
  if (body.isVerified !== undefined || body.rawVerificationResponse) {
    bank.is_verified = body.isVerified ?? mapped.isVerified ?? bank.is_verified;
    changedFields.push('is_verified');
  }
  if (body.verificationStatus !== undefined || mapped.verificationStatus) {
    bank.verification_status =
      body.verificationStatus ??
      mapped.verificationStatus ??
      bank.verification_status;
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

  return [...new Set(changedFields)];
}

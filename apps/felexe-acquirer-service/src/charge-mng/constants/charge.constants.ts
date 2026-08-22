export enum PaymentMode {
  PAYIN = 'payin',
  PAYOUT = 'payout',
}

export enum ModeOfCharge {
  FLAT = 'flat',
  SLAB = 'slab',
}

export const DECIMAL_AMOUNT_REGEX = /^\d+(\.\d{1,4})?$/;
export const DECIMAL_AMOUNT_MESSAGE =
  'must be a non-negative INR amount with up to 4 decimal places';

import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  DECIMAL_AMOUNT_MESSAGE,
  DECIMAL_AMOUNT_REGEX,
  ModeOfCharge,
  PaymentMode,
} from '../constants/charge.constants';

export class FlatChargeDto {
  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `chargePercent ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  chargePercent: string;

  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `chargeFlat ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  chargeFlat: string;

  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `commissionPercent ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  commissionPercent: string;

  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `commissionFlat ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  commissionFlat: string;
}

export class ChargeSlabDto {
  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `minAmount ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  minAmount: string;

  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `maxAmount ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  maxAmount: string;

  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `chargePercent ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  chargePercent: string;

  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `chargeFlat ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  chargeFlat: string;

  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `commissionPercent ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  commissionPercent: string;

  @Matches(DECIMAL_AMOUNT_REGEX, {
    message: `commissionFlat ${DECIMAL_AMOUNT_MESSAGE}`,
  })
  commissionFlat: string;
}

export class SaveMerchantChargeDto {
  @IsOptional()
  @IsUUID('4')
  clientId?: string;

  @IsEnum(PaymentMode, { message: 'paymentMode must be payin or payout' })
  paymentMode: PaymentMode;

  @IsEnum(ModeOfCharge, { message: 'modeOfCharge must be flat or slab' })
  modeOfCharge: ModeOfCharge;

  @ValidateIf((body: SaveMerchantChargeDto) => body.modeOfCharge === ModeOfCharge.FLAT)
  @ValidateNested()
  @Type(() => FlatChargeDto)
  flat?: FlatChargeDto;

  @ValidateIf((body: SaveMerchantChargeDto) => body.modeOfCharge === ModeOfCharge.SLAB)
  @IsArray()
  @ArrayMinSize(1, { message: 'slabs must contain at least one range' })
  @ValidateNested({ each: true })
  @Type(() => ChargeSlabDto)
  slabs?: ChargeSlabDto[];
}

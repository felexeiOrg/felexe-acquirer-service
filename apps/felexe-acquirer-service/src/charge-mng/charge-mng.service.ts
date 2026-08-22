import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { badRequestForField } from '../common/validation/field-error.util';
import { MerchantOnboardingService } from '../merchant-onboarding/merchant-onboarding.service';
import { ModeOfCharge, PaymentMode } from './constants/charge.constants';
import {
  ChargeSlabDto,
  SaveMerchantChargeDto,
} from './dto/save-merchant-charge.dto';
import { MerchantChargeSlab } from './entities/merchant-charge-slab.entity';
import { MerchantCharge } from './entities/merchant-charge.entity';

type MerchantLookup = {
  clientId?: string;
  verificationStatus?: string;
  legalName?: string | null;
  tradeName?: string | null;
  gstin?: string | null;
};

@Injectable()
export class ChargeMngService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly merchantOnboardingService: MerchantOnboardingService,
    @InjectRepository(MerchantCharge)
    private readonly chargeRepository: Repository<MerchantCharge>,
  ) {}

  async getCharge(clientId: string) {
    const merchant = await this.requireVerifiedMerchant(clientId);
    const rows = await this.chargeRepository.find({
      where: { client_id: clientId },
      order: { payment_mode: 'ASC' },
    });

    const byMode = {
      [PaymentMode.PAYIN]: null as ReturnType<
        ChargeMngService['toConfigResponse']
      > | null,
      [PaymentMode.PAYOUT]: null as ReturnType<
        ChargeMngService['toConfigResponse']
      > | null,
    };

    for (const row of rows) {
      if (row.payment_mode === PaymentMode.PAYIN) {
        byMode[PaymentMode.PAYIN] = this.toConfigResponse(row);
      }
      if (row.payment_mode === PaymentMode.PAYOUT) {
        byMode[PaymentMode.PAYOUT] = this.toConfigResponse(row);
      }
    }

    return {
      clientId,
      merchant: {
        legalName: merchant.legalName ?? null,
        tradeName: merchant.tradeName ?? null,
        gstin: merchant.gstin ?? null,
        verificationStatus: merchant.verificationStatus ?? 'verified',
      },
      payin: byMode.payin,
      payout: byMode.payout,
    };
  }

  async saveCharge(clientId: string, body: SaveMerchantChargeDto) {
    await this.requireVerifiedMerchant(clientId);

    if (body.clientId && body.clientId !== clientId) {
      throw badRequestForField(
        'clientId',
        'clientId in body must match the merchant in the URL',
      );
    }

    if (body.modeOfCharge === ModeOfCharge.FLAT && !body.flat) {
      throw badRequestForField('flat', 'flat charges are required for flat mode');
    }

    if (body.modeOfCharge === ModeOfCharge.SLAB) {
      this.assertValidSlabs(body.slabs ?? []);
    }

    return this.dataSource.transaction(async (manager) => {
      const chargeRepo = manager.getRepository(MerchantCharge);
      const slabRepo = manager.getRepository(MerchantChargeSlab);

      let charge = await chargeRepo.findOne({
        where: { client_id: clientId, payment_mode: body.paymentMode },
      });

      if (!charge) {
        charge = chargeRepo.create({
          client_id: clientId,
          payment_mode: body.paymentMode,
        });
      }

      charge.mode_of_charge = body.modeOfCharge;

      if (body.modeOfCharge === ModeOfCharge.FLAT && body.flat) {
        charge.charge_percent = body.flat.chargePercent;
        charge.charge_flat = body.flat.chargeFlat;
        charge.commission_percent = body.flat.commissionPercent;
        charge.commission_flat = body.flat.commissionFlat;
      } else {
        charge.charge_percent = null;
        charge.charge_flat = null;
        charge.commission_percent = null;
        charge.commission_flat = null;
      }

      const saved = await chargeRepo.save(charge);

      await slabRepo.delete({ charge_id: saved.id });

      if (body.modeOfCharge === ModeOfCharge.SLAB) {
        const slabs = (body.slabs ?? []).map((slab, index) =>
          slabRepo.create({
            charge_id: saved.id,
            sort_order: index,
            min_amount: slab.minAmount,
            max_amount: slab.maxAmount,
            charge_percent: slab.chargePercent,
            charge_flat: slab.chargeFlat,
            commission_percent: slab.commissionPercent,
            commission_flat: slab.commissionFlat,
          }),
        );
        saved.slabs = await slabRepo.save(slabs);
      } else {
        saved.slabs = [];
      }

      return {
        message: 'Merchant charges saved',
        clientId,
        ...this.toConfigResponse(saved),
      };
    });
  }

  private async requireVerifiedMerchant(clientId: string): Promise<MerchantLookup> {
    let merchant: MerchantLookup;

    try {
      merchant = (await this.merchantOnboardingService.getMerchant(
        clientId,
      )) as MerchantLookup;
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 404) {
        throw new NotFoundException(
          `Merchant not found for clientId ${clientId}`,
        );
      }
      throw error;
    }

    if (merchant.verificationStatus !== 'verified') {
      throw new BadRequestException({
        statusCode: 400,
        message:
          'Charges can be configured only after the merchant is verified',
        error: 'Bad Request',
        errors: [
          {
            field: 'clientId',
            message:
              'Charges can be configured only after the merchant is verified',
          },
        ],
      });
    }

    return merchant;
  }

  private assertValidSlabs(slabs: ChargeSlabDto[]) {
    if (!slabs.length) {
      throw badRequestForField('slabs', 'slabs must contain at least one range');
    }

    const parsed = slabs.map((slab, index) => {
      const min = Number(slab.minAmount);
      const max = Number(slab.maxAmount);
      if (!(min < max)) {
        throw badRequestForField(
          `slabs.${index}.maxAmount`,
          'maxAmount must be greater than minAmount',
        );
      }
      return { ...slab, min, max, index };
    });

    parsed.sort((a, b) => a.min - b.min);

    for (let i = 1; i < parsed.length; i += 1) {
      if (parsed[i].min < parsed[i - 1].max) {
        throw badRequestForField(
          'slabs',
          `Slab ranges overlap between ${parsed[i - 1].min}-${parsed[i - 1].max} and ${parsed[i].min}-${parsed[i].max}`,
        );
      }
    }
  }

  private toConfigResponse(charge: MerchantCharge) {
    const slabs = [...(charge.slabs ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );

    return {
      paymentMode: charge.payment_mode,
      modeOfCharge: charge.mode_of_charge,
      flat:
        charge.mode_of_charge === ModeOfCharge.FLAT
          ? {
              chargePercent: this.asAmount(charge.charge_percent),
              chargeFlat: this.asAmount(charge.charge_flat),
              commissionPercent: this.asAmount(charge.commission_percent),
              commissionFlat: this.asAmount(charge.commission_flat),
            }
          : null,
      slabs:
        charge.mode_of_charge === ModeOfCharge.SLAB
          ? slabs.map((slab) => ({
              minAmount: this.asAmount(slab.min_amount),
              maxAmount: this.asAmount(slab.max_amount),
              chargePercent: this.asAmount(slab.charge_percent),
              chargeFlat: this.asAmount(slab.charge_flat),
              commissionPercent: this.asAmount(slab.commission_percent),
              commissionFlat: this.asAmount(slab.commission_flat),
            }))
          : [],
    };
  }

  private asAmount(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '0.00';
    }
    return String(value);
  }
}

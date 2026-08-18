import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './entities/merchant.entity';

@Injectable()
export class MerchantContextService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  async findMerchantByClientId(clientId: string): Promise<Merchant> {
    const normalizedClientId = String(clientId ?? '').trim();
    if (!normalizedClientId) {
      throw new BadRequestException('clientId is required');
    }

    const merchant = await this.merchantRepository.findOne({
      where: { client_id: normalizedClientId },
    });
    if (!merchant) {
      throw new NotFoundException(
        `Merchant not found for clientId ${normalizedClientId}`,
      );
    }

    return merchant;
  }

  async assertMerchantActive(clientId: string): Promise<Merchant> {
    const merchant = await this.findMerchantByClientId(clientId);
    if (merchant.status === 'deleted') {
      throw new BadRequestException('Cannot modify records for a deleted merchant');
    }
    return merchant;
  }
}

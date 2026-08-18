import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BankDetailCrudService } from './bank-detail-crud.service';
import {
  ClientIdPayloadDto,
  ClientIdResourcePayloadDto,
  CreateBankDetailPayloadDto,
  UpdateBankDetailPayloadDto,
} from './dto/payload.dto';

@Controller()
export class BankDetailController {
  constructor(private readonly bankDetailCrudService: BankDetailCrudService) {}

  @MessagePattern({ cmd: 'merchant-onboarding.bankDetails.list' })
  list(@Payload() payload: ClientIdPayloadDto) {
    return this.bankDetailCrudService.list(payload.clientId);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.bankDetails.get' })
  get(@Payload() payload: ClientIdResourcePayloadDto) {
    return this.bankDetailCrudService.get(payload.clientId, payload.id);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.bankDetails.create' })
  create(@Payload() payload: CreateBankDetailPayloadDto) {
    const { clientId, ...body } = payload;
    return this.bankDetailCrudService.create(clientId, body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.bankDetails.update' })
  update(@Payload() payload: UpdateBankDetailPayloadDto) {
    const { clientId, id, ...body } = payload;
    return this.bankDetailCrudService.update(clientId, id, body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.bankDetails.delete' })
  delete(@Payload() payload: ClientIdResourcePayloadDto) {
    return this.bankDetailCrudService.delete(payload.clientId, payload.id);
  }
}

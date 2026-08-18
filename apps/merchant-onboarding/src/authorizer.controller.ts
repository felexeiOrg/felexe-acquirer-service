import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthorizerCrudService } from './authorizer-crud.service';
import {
  ClientIdPayloadDto,
  ClientIdResourcePayloadDto,
  CreateAuthorizerPayloadDto,
  UpdateAuthorizerPayloadDto,
} from './dto/payload.dto';

@Controller()
export class AuthorizerController {
  constructor(private readonly authorizerCrudService: AuthorizerCrudService) {}

  @MessagePattern({ cmd: 'merchant-onboarding.authorizers.list' })
  list(@Payload() payload: ClientIdPayloadDto) {
    return this.authorizerCrudService.list(payload.clientId);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.authorizers.get' })
  get(@Payload() payload: ClientIdResourcePayloadDto) {
    return this.authorizerCrudService.get(payload.clientId, payload.id);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.authorizers.create' })
  create(@Payload() payload: CreateAuthorizerPayloadDto) {
    const { clientId, ...body } = payload;
    return this.authorizerCrudService.create(clientId, body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.authorizers.update' })
  update(@Payload() payload: UpdateAuthorizerPayloadDto) {
    const { clientId, id, ...body } = payload;
    return this.authorizerCrudService.update(clientId, id, body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.authorizers.delete' })
  delete(@Payload() payload: ClientIdResourcePayloadDto) {
    return this.authorizerCrudService.delete(payload.clientId, payload.id);
  }
}

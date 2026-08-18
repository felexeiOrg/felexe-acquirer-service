import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ClientIdPayloadDto,
  ClientIdResourcePayloadDto,
  CreateDirectorPayloadDto,
  UpdateDirectorPayloadDto,
} from './dto/payload.dto';
import { DirectorCrudService } from './director-crud.service';

@Controller()
export class DirectorController {
  constructor(private readonly directorCrudService: DirectorCrudService) {}

  @MessagePattern({ cmd: 'merchant-onboarding.directors.list' })
  list(@Payload() payload: ClientIdPayloadDto) {
    return this.directorCrudService.list(payload.clientId);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.directors.get' })
  get(@Payload() payload: ClientIdResourcePayloadDto) {
    return this.directorCrudService.get(payload.clientId, payload.id);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.directors.create' })
  create(@Payload() payload: CreateDirectorPayloadDto) {
    const { clientId, ...body } = payload;
    return this.directorCrudService.create(clientId, body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.directors.update' })
  update(@Payload() payload: UpdateDirectorPayloadDto) {
    const { clientId, id, ...body } = payload;
    return this.directorCrudService.update(clientId, id, body);
  }

  @MessagePattern({ cmd: 'merchant-onboarding.directors.delete' })
  delete(@Payload() payload: ClientIdResourcePayloadDto) {
    return this.directorCrudService.delete(payload.clientId, payload.id);
  }
}

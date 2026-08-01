import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DisputeMngService } from './dispute-mng.service';

@Controller()
export class DisputeMngController {
  constructor(private readonly disputeMngService: DisputeMngService) {}

  @MessagePattern({ cmd: 'dispute-mng.getHello' })
  getHello(): string {
    return this.disputeMngService.getHello();
  }
}

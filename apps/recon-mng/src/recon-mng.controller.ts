import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ReconMngService } from './recon-mng.service';

@Controller()
export class ReconMngController {
  constructor(private readonly reconMngService: ReconMngService) {}

  @MessagePattern({ cmd: 'recon-mng.getHello' })
  getHello(): string {
    return this.reconMngService.getHello();
  }
}

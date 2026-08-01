import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MisReportsService } from './mis-reports.service';

@Controller()
export class MisReportsController {
  constructor(private readonly misReportsService: MisReportsService) {}

  @MessagePattern({ cmd: 'mis-reports.getHello' })
  getHello(): string {
    return this.misReportsService.getHello();
  }
}

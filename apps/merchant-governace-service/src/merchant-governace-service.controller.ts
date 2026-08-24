import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  WebsiteCrawlPayloadDto,
  WebsiteStatusPayloadDto,
} from './dto/website-crawl.dto';
import { MerchantGovernaceServiceService } from './merchant-governace-service.service';
import { WebsiteCrawlService } from './website-crawl.service';

@Controller()
export class MerchantGovernaceServiceController {
  constructor(
    private readonly merchantGovernaceServiceService: MerchantGovernaceServiceService,
    private readonly websiteCrawlService: WebsiteCrawlService,
  ) {}

  @MessagePattern({ cmd: 'merchant-governace.getHello' })
  getHello(): string {
    return this.merchantGovernaceServiceService.getHello();
  }

  @MessagePattern({ cmd: 'merchant-governace.websiteCrawl' })
  websiteCrawl(@Payload() payload: WebsiteCrawlPayloadDto) {
    return this.websiteCrawlService.crawl(payload);
  }

  @MessagePattern({ cmd: 'merchant-governace.getWebsiteStatus' })
  getWebsiteStatus(@Payload() payload: WebsiteStatusPayloadDto) {
    return this.websiteCrawlService.getStatus(payload);
  }
}

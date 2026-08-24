import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ADMIN_ROLES } from '../auth/constants/admin-roles.constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClientIdPipe } from '../common/pipes/uuid-param.pipe';
import { WebsiteCrawlDto } from './dto/website-crawl.dto';
import { MerchantGovernanceSvcService } from './merchant-governance-svc.service';

@Controller('merchant-governance-svc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class MerchantGovernanceSvcController {
  constructor(
    private readonly merchantGovernanceSvcService: MerchantGovernanceSvcService,
  ) {}

  @Post('websiteCrawl/:clientId')
  websiteCrawl(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: WebsiteCrawlDto,
  ) {
    return this.merchantGovernanceSvcService.websiteCrawl(
      clientId,
      body.websiteUrl,
    );
  }

  @Get('getWebsiteStatus/:clientId')
  getWebsiteStatus(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Query('includeHistory') includeHistory?: string,
  ) {
    return this.merchantGovernanceSvcService.getWebsiteStatus(
      clientId,
      includeHistory === 'true',
    );
  }
}

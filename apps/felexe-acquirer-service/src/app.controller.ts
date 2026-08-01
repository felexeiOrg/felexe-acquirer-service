import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('MERCHANT_ONBOARDING_SERVICE')
    private readonly merchantOnboardingClient: ClientProxy,
    @Inject('MERCHANT_GOVERNACE_SERVICE')
    private readonly merchantGovernaceClient: ClientProxy,
    @Inject('DISPUTE_MNG_SERVICE')
    private readonly disputeMngClient: ClientProxy,
    @Inject('RECON_MNG_SERVICE')
    private readonly reconMngClient: ClientProxy,
    @Inject('MIS_REPORTS_SERVICE')
    private readonly misReportsClient: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('merchant-onboarding')
  getMerchantOnboarding() {
    return this.merchantOnboardingClient.send(
      { cmd: 'merchant-onboarding.getHello' },
      {},
    );
  }

  @Get('merchant-governace')
  getMerchantGovernace() {
    return this.merchantGovernaceClient.send(
      { cmd: 'merchant-governace.getHello' },
      {},
    );
  }

  @Get('dispute-mng')
  getDisputeMng() {
    return this.disputeMngClient.send({ cmd: 'dispute-mng.getHello' }, {});
  }

  @Get('recon-mng')
  getReconMng() {
    return this.reconMngClient.send({ cmd: 'recon-mng.getHello' }, {});
  }

  @Get('mis-reports')
  getMisReports() {
    return this.misReportsClient.send({ cmd: 'mis-reports.getHello' }, {});
  }
}

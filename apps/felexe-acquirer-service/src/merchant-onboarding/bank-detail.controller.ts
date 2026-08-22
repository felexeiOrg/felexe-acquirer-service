import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientIdPipe, ResourceIdPipe } from '../common/pipes/uuid-param.pipe';
import {
  CreateBankDetailDto,
  UpdateBankDetailDto,
  VerifyBankDetailDto,
} from './dto/bank-detail.dto';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Controller('merchant-onboarding/:clientId/bank-details')
export class BankDetailController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
  ) {}

  @Get()
  listBankDetails(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.listBankDetails(clientId);
  }

  @Get(':id')
  getBankDetail(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
  ) {
    return this.merchantOnboardingService.getBankDetail(clientId, id);
  }

  @Post('verify')
  verifyBankDetail(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: VerifyBankDetailDto,
  ) {
    return this.merchantOnboardingService.verifyBankDetail(clientId, body);
  }

  @Post()
  createBankDetail(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: CreateBankDetailDto,
  ) {
    return this.merchantOnboardingService.createBankDetail(clientId, body);
  }

  @Post(':id/update')
  updateBankDetail(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
    @Body() body: UpdateBankDetailDto,
  ) {
    return this.merchantOnboardingService.updateBankDetail(clientId, id, body);
  }

  @Post(':id/delete')
  deleteBankDetail(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
  ) {
    return this.merchantOnboardingService.deleteBankDetail(clientId, id);
  }
}

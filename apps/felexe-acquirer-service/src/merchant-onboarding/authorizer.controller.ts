import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientIdPipe, ResourceIdPipe } from '../common/pipes/uuid-param.pipe';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Controller('merchant-onboarding/:clientId/authorizers')
export class AuthorizerController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
  ) {}

  @Get()
  listAuthorizers(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.listAuthorizers(clientId);
  }

  @Get(':id')
  getAuthorizer(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
  ) {
    return this.merchantOnboardingService.getAuthorizer(clientId, id);
  }

  @Post()
  createAuthorizer(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: CreatePersonDto,
  ) {
    return this.merchantOnboardingService.createAuthorizer(clientId, body);
  }

  @Post(':id/update')
  updateAuthorizer(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
    @Body() body: UpdatePersonDto,
  ) {
    return this.merchantOnboardingService.updateAuthorizer(clientId, id, body);
  }

  @Post(':id/delete')
  deleteAuthorizer(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
  ) {
    return this.merchantOnboardingService.deleteAuthorizer(clientId, id);
  }
}

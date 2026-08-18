import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientIdPipe, ResourceIdPipe } from '../common/pipes/uuid-param.pipe';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Controller('merchant-onboarding/:clientId/directors')
export class DirectorController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
  ) {}

  @Get()
  listDirectors(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.listDirectors(clientId);
  }

  @Get(':id')
  getDirector(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
  ) {
    return this.merchantOnboardingService.getDirector(clientId, id);
  }

  @Post()
  createDirector(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: CreatePersonDto,
  ) {
    return this.merchantOnboardingService.createDirector(clientId, body);
  }

  @Post(':id/update')
  updateDirector(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
    @Body() body: UpdatePersonDto,
  ) {
    return this.merchantOnboardingService.updateDirector(clientId, id, body);
  }

  @Post(':id/delete')
  deleteDirector(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
  ) {
    return this.merchantOnboardingService.deleteDirector(clientId, id);
  }
}

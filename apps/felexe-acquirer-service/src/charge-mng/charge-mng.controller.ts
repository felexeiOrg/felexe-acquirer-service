import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ADMIN_ROLES } from '../auth/constants/admin-roles.constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClientIdPipe } from '../common/pipes/uuid-param.pipe';
import { ChargeMngService } from './charge-mng.service';
import { SaveMerchantChargeDto } from './dto/save-merchant-charge.dto';

@Controller('charges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class ChargeMngController {
  constructor(private readonly chargeMngService: ChargeMngService) {}

  @Get('getCharge/:clientId')
  getCharge(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.chargeMngService.getCharge(clientId);
  }

  @Post('saveCharge/:clientId')
  saveCharge(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: SaveMerchantChargeDto,
  ) {
    return this.chargeMngService.saveCharge(clientId, body);
  }
}

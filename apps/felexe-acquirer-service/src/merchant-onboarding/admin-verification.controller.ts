import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ADMIN_ROLES } from '../auth/constants/admin-roles.constants';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ClientIdPipe, ResourceIdPipe } from '../common/pipes/uuid-param.pipe';
import { AdminReviewDecisionDto } from './dto/admin-verification.dto';
import { AdminVkycReviewDto } from './dto/admin-vkyc-review.dto';
import { MerchantOnboardingService } from './merchant-onboarding.service';

@Controller('merchant-onboarding/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
export class AdminVerificationController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
  ) {}

  @Get('pending')
  listPending() {
    return this.merchantOnboardingService.listAdminPendingVerifications();
  }

  @Get(':clientId/vkyc-persons')
  @Roles(...ADMIN_ROLES, UserRole.PARTNER)
  listVkycPersons(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.listVkycPersonsByClient(clientId);
  }

  @Post('directors/:id/approve')
  @Roles(...ADMIN_ROLES, UserRole.PARTNER)
  approveDirector(
    @Param('id', ResourceIdPipe) id: string,
    @Body() body: AdminVkycReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.merchantOnboardingService.reviewVkycPerson({
      personId: id,
      personType: 'Director',
      type: body.type ?? 'VKYC',
      decision: 'approve',
      reason: body.reason,
      reviewerUserId: request.user.sub,
    });
  }

  @Post('directors/:id/reject')
  @Roles(...ADMIN_ROLES, UserRole.PARTNER)
  rejectDirector(
    @Param('id', ResourceIdPipe) id: string,
    @Body() body: AdminVkycReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.merchantOnboardingService.reviewVkycPerson({
      personId: id,
      personType: 'Director',
      type: body.type ?? 'VKYC',
      decision: 'reject',
      reason: body.reason,
      reviewerUserId: request.user.sub,
    });
  }

  @Post('authorizers/:id/approve')
  @Roles(...ADMIN_ROLES, UserRole.PARTNER)
  approveAuthorizer(
    @Param('id', ResourceIdPipe) id: string,
    @Body() body: AdminVkycReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.merchantOnboardingService.reviewVkycPerson({
      personId: id,
      personType: 'Authorizer',
      type: body.type ?? 'VKYC',
      decision: 'approve',
      reason: body.reason,
      reviewerUserId: request.user.sub,
    });
  }

  @Post('authorizers/:id/reject')
  @Roles(...ADMIN_ROLES, UserRole.PARTNER)
  rejectAuthorizer(
    @Param('id', ResourceIdPipe) id: string,
    @Body() body: AdminVkycReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.merchantOnboardingService.reviewVkycPerson({
      personId: id,
      personType: 'Authorizer',
      type: body.type ?? 'VKYC',
      decision: 'reject',
      reason: body.reason,
      reviewerUserId: request.user.sub,
    });
  }

  @Get(':clientId')
  getReview(@Param('clientId', ClientIdPipe) clientId: string) {
    return this.merchantOnboardingService.getAdminReview(clientId);
  }

  @Post(':clientId/sections/:section/review')
  reviewSection(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('section') section: string,
    @Body() body: AdminReviewDecisionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.merchantOnboardingService.reviewAdminSection({
      clientId,
      section,
      reviewerUserId: request.user.sub,
      ...body,
    });
  }

  @Post(':clientId/documents/:documentId/review')
  reviewDocument(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('documentId', ResourceIdPipe) documentId: string,
    @Body() body: AdminReviewDecisionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.merchantOnboardingService.reviewAdminDocument({
      clientId,
      documentId,
      reviewerUserId: request.user.sub,
      ...body,
    });
  }

  @Post(':clientId/approval')
  submitApproval(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Body() body: AdminReviewDecisionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.merchantOnboardingService.submitAdminApproval({
      clientId,
      reviewerUserId: request.user.sub,
      ...body,
    });
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { AddMerchantDetailsDto } from './dto/add-merchant-details.dto';
import {
  CreateBankDetailDto,
  UpdateBankDetailDto,
  VerifyBankDetailDto,
} from './dto/bank-detail.dto';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { StartOnboardingDto } from './dto/start-onboarding.dto';
import { SubmitMerchantDetailsSectionDto } from './dto/submit-merchant-details-section.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { mapMicroserviceError } from '../common/validation/map-microservice-error';

@Injectable()
export class MerchantOnboardingService {
  constructor(
    @Inject('MERCHANT_ONBOARDING_SERVICE')
    private readonly merchantOnboardingClient: ClientProxy,
  ) {}

  async sendInvite(body: SendInviteDto) {
    return this.send('merchant-onboarding.sendInvite', body);
  }

  getInvitedMerchantList() {
    return this.send('merchant-onboarding.getInvitedMerchantList', {});
  }

  getOnboardedMerchantList() {
    return this.send('merchant-onboarding.getOnboardedMerchantList', {});
  }

  getCompletedMerchantList() {
    return this.send('merchant-onboarding.getCompletedMerchantList', {});
  }

  listAdminPendingVerifications() {
    return this.send('merchant-onboarding.admin.pending', {});
  }

  getAdminReview(clientId: string) {
    return this.send('merchant-onboarding.admin.review', { clientId });
  }

  reviewAdminSection(payload: {
    clientId: string;
    section: string;
    reviewerUserId: string;
    decision: string;
    remarks?: string | null;
  }) {
    return this.send('merchant-onboarding.admin.reviewSection', payload);
  }

  reviewAdminDocument(payload: {
    clientId: string;
    documentId: string;
    reviewerUserId: string;
    decision: string;
    remarks?: string | null;
  }) {
    return this.send('merchant-onboarding.admin.reviewDocument', payload);
  }

  submitAdminApproval(payload: {
    clientId: string;
    reviewerUserId: string;
    decision: string;
    remarks?: string | null;
  }) {
    return this.send('merchant-onboarding.admin.approval', payload);
  }

  async addMerchantDetails(body: AddMerchantDetailsDto) {
    return this.send('merchant-onboarding.addMerchantDetails', body);
  }

  async getMerchant(clientId: string) {
    return this.send('merchant-onboarding.getMerchant', { clientId });
  }

  async updateMerchant(clientId: string, body: UpdateMerchantDto) {
    return this.send('merchant-onboarding.updateMerchant', { clientId, ...body });
  }

  async deleteMerchant(clientId: string) {
    return this.send('merchant-onboarding.deleteMerchant', { clientId });
  }

  async listDirectors(clientId: string) {
    return this.send('merchant-onboarding.directors.list', { clientId });
  }

  async getDirector(clientId: string, id: string) {
    return this.send('merchant-onboarding.directors.get', { clientId, id });
  }

  async createDirector(clientId: string, body: CreatePersonDto) {
    return this.send('merchant-onboarding.directors.create', {
      clientId,
      ...body,
    });
  }

  async updateDirector(clientId: string, id: string, body: UpdatePersonDto) {
    return this.send('merchant-onboarding.directors.update', {
      clientId,
      id,
      ...body,
    });
  }

  async deleteDirector(clientId: string, id: string) {
    return this.send('merchant-onboarding.directors.delete', { clientId, id });
  }

  async uploadDirectorVideoKyc(
    clientId: string,
    id: string,
    videoKycUrl: string,
  ) {
    return this.send('merchant-onboarding.directors.videoKyc.upload', {
      clientId,
      id,
      videoKycUrl,
    });
  }

  async listAuthorizers(clientId: string) {
    return this.send('merchant-onboarding.authorizers.list', { clientId });
  }

  async getAuthorizer(clientId: string, id: string) {
    return this.send('merchant-onboarding.authorizers.get', { clientId, id });
  }

  async createAuthorizer(clientId: string, body: CreatePersonDto) {
    return this.send('merchant-onboarding.authorizers.create', {
      clientId,
      ...body,
    });
  }

  async updateAuthorizer(clientId: string, id: string, body: UpdatePersonDto) {
    return this.send('merchant-onboarding.authorizers.update', {
      clientId,
      id,
      ...body,
    });
  }

  async deleteAuthorizer(clientId: string, id: string) {
    return this.send('merchant-onboarding.authorizers.delete', { clientId, id });
  }

  async uploadAuthorizerVideoKyc(
    clientId: string,
    id: string,
    videoKycUrl: string,
  ) {
    return this.send('merchant-onboarding.authorizers.videoKyc.upload', {
      clientId,
      id,
      videoKycUrl,
    });
  }

  async listBankDetails(clientId: string) {
    return this.send('merchant-onboarding.bankDetails.list', { clientId });
  }

  async getBankDetail(clientId: string, id: string) {
    return this.send('merchant-onboarding.bankDetails.get', { clientId, id });
  }

  async verifyBankDetail(clientId: string, body: VerifyBankDetailDto) {
    return this.send('merchant-onboarding.bankDetails.verify', {
      clientId,
      ...body,
    });
  }

  async createBankDetail(clientId: string, body: CreateBankDetailDto) {
    return this.send('merchant-onboarding.bankDetails.create', {
      clientId,
      ...body,
    });
  }

  async updateBankDetail(
    clientId: string,
    id: string,
    body: UpdateBankDetailDto,
  ) {
    return this.send('merchant-onboarding.bankDetails.update', {
      clientId,
      id,
      ...body,
    });
  }

  async deleteBankDetail(clientId: string, id: string) {
    return this.send('merchant-onboarding.bankDetails.delete', { clientId, id });
  }

  async uploadMerchantDocument(payload: {
    clientId: string;
    documentType: string;
    fileUrl: string;
    fileName: string;
    mimeType: string;
  }) {
    return this.send('merchant-onboarding.documents.upload', payload);
  }

  async listMerchantDocuments(clientId: string) {
    return this.send('merchant-onboarding.documents.list', { clientId });
  }

  startOnboarding(body: StartOnboardingDto) {
    return this.send('merchant-onboarding.onboarding.start', body);
  }

  getOnboardingStatusByUser(userId: string) {
    return this.send('merchant-onboarding.onboarding.statusByUser', { userId });
  }

  getOnboardingStatusByClient(clientId: string) {
    return this.send('merchant-onboarding.onboarding.statusByClient', {
      clientId,
    });
  }

  getMerchantDetailsFormConfig(clientId: string) {
    return this.send('merchant-onboarding.onboarding.formConfig', { clientId });
  }

  submitMerchantDetailsSection(
    clientId: string,
    body: SubmitMerchantDetailsSectionDto,
  ) {
    return this.send('merchant-onboarding.onboarding.submitMerchantDetails', {
      clientId,
      ...body,
    });
  }

  submitDirectorsSection(clientId: string) {
    return this.send('merchant-onboarding.onboarding.submitDirectors', {
      clientId,
    });
  }

  submitAuthorizersSection(clientId: string) {
    return this.send('merchant-onboarding.onboarding.submitAuthorizers', {
      clientId,
    });
  }

  submitBankDetailsSection(clientId: string) {
    return this.send('merchant-onboarding.onboarding.submitBankDetails', {
      clientId,
    });
  }

  submitVideoKycSection(clientId: string) {
    return this.send('merchant-onboarding.onboarding.submitVideoKyc', {
      clientId,
    });
  }

  submitDocumentsSection(clientId: string) {
    return this.send('merchant-onboarding.onboarding.submitDocuments', {
      clientId,
    });
  }

  completeOnboarding(clientId: string) {
    return this.send('merchant-onboarding.onboarding.complete', { clientId });
  }

  assertVkycPerson(payload: {
    userId: string;
    personId: string;
    type: string;
  }) {
    return this.send('merchant-onboarding.vkyc.assertPerson', payload);
  }

  updateVkycSession(payload: {
    userId: string;
    personId: string;
    type: string;
    sessionId: string;
  }) {
    return this.send('merchant-onboarding.vkyc.updateSession', payload);
  }

  applyVkycWebhook(payload: Record<string, unknown>) {
    return this.send('merchant-onboarding.vkyc.applyWebhook', payload);
  }

  listVkycPersonsByUser(userId: string) {
    return this.send('merchant-onboarding.vkyc.listByUser', { userId });
  }

  listVkycPersonsByClient(clientId: string) {
    return this.send('merchant-onboarding.vkyc.listByClient', { clientId });
  }

  reviewVkycPerson(payload: {
    personId: string;
    personType: string;
    type: string;
    decision: string;
    reason?: string | null;
    reviewerUserId: string;
  }) {
    return this.send('merchant-onboarding.vkyc.adminReview', payload);
  }

  private send<T>(cmd: string, body: unknown): Promise<T> {
    return firstValueFrom(
      this.merchantOnboardingClient.send<T>({ cmd }, body).pipe(
        catchError((err: unknown) =>
          throwError(() => mapMicroserviceError(err)),
        ),
      ),
    );
  }
}

import { Director } from '../entities/director.entity';
import { AuthorizedSignatory } from '../entities/authorized-signatory.entity';
import { CreatePersonDto, UpdatePersonDto } from '../dto/person.dto';

export function toPersonResponse(person: Director | AuthorizedSignatory) {
  return {
    id: person.id,
    clientId: person.client_id,
    din: person.din,
    pan: person.pan,
    firstName: person.first_name,
    middleName: person.middle_name,
    lastName: person.last_name,
    fullName: person.full_name,
    dateOfAppointment: person.date_of_appointment,
    disqualified: person.disqualified,
    isVerified: person.is_verified,
    rejectionReason: person.rejection_reason,
    sessionId: person.session_id,
    videoKycUrl: person.video_kyc_url,
    faceVideoUrl: person.face_video_url,
    aadhaarPhotoUrl: person.aadhaar_photo_url,
    panPhotoUrl: person.pan_photo_url,
    videoKycStatus: person.video_kyc_status,
    videoKycResponse: person.video_kyc_response,
    videoKycMetadata: person.video_kyc_metadata,
    isVkycVerified: person.is_vkyc_verified,
    vkycRejectionReason: person.vkyc_rejection_reason,
    status: person.status,
    createdAt: person.created_at,
    updatedAt: person.updated_at,
  };
}

export function fromCreatePersonDto(
  clientId: string,
  body: CreatePersonDto,
): Partial<Director> {
  return {
    client_id: clientId,
    din: body.din ?? null,
    pan: body.pan ?? null,
    first_name: body.firstName ?? null,
    middle_name: body.middleName ?? null,
    last_name: body.lastName ?? null,
    full_name: body.fullName ?? null,
    date_of_appointment: body.dateOfAppointment ?? null,
    disqualified: body.disqualified ?? false,
    is_verified: body.isVerified ?? false,
    video_kyc_url: body.videoKycUrl ?? null,
    video_kyc_status: body.videoKycStatus ?? null,
    is_vkyc_verified: body.isVkycVerified ?? false,
    status: body.status ?? 'active',
  };
}

export function applyPersonUpdate(
  person: Director | AuthorizedSignatory,
  body: UpdatePersonDto,
): string[] {
  const changedFields: string[] = [];

  if (body.din !== undefined) {
    person.din = body.din;
    changedFields.push('din');
  }
  if (body.pan !== undefined) {
    person.pan = body.pan;
    changedFields.push('pan');
  }
  if (body.firstName !== undefined) {
    person.first_name = body.firstName;
    changedFields.push('first_name');
  }
  if (body.middleName !== undefined) {
    person.middle_name = body.middleName;
    changedFields.push('middle_name');
  }
  if (body.lastName !== undefined) {
    person.last_name = body.lastName;
    changedFields.push('last_name');
  }
  if (body.fullName !== undefined) {
    person.full_name = body.fullName;
    changedFields.push('full_name');
  }
  if (body.dateOfAppointment !== undefined) {
    person.date_of_appointment = body.dateOfAppointment;
    changedFields.push('date_of_appointment');
  }
  if (body.disqualified !== undefined) {
    person.disqualified = body.disqualified;
    changedFields.push('disqualified');
  }
  if (body.isVerified !== undefined) {
    person.is_verified = body.isVerified;
    changedFields.push('is_verified');
  }
  if (body.videoKycUrl !== undefined) {
    person.video_kyc_url = body.videoKycUrl;
    changedFields.push('video_kyc_url');
  }
  if (body.videoKycStatus !== undefined) {
    person.video_kyc_status = body.videoKycStatus;
    changedFields.push('video_kyc_status');
  }
  if (body.isVkycVerified !== undefined) {
    person.is_vkyc_verified = body.isVkycVerified;
    changedFields.push('is_vkyc_verified');
  }
  if (body.status !== undefined) {
    person.status = body.status;
    changedFields.push('status');
  }

  return changedFields;
}

import { IsString, IsUUID } from 'class-validator';
import {
  CreateBankDetailDto,
  UpdateBankDetailDto,
  VerifyBankDetailDto,
} from './bank-detail.dto';
import { CreatePersonDto, UpdatePersonDto } from './person.dto';
import { UpdateMerchantDto } from './update-merchant.dto';

export class ClientIdPayloadDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;
}

export class ClientIdResourcePayloadDto extends ClientIdPayloadDto {
  @IsUUID('4', { message: 'id must be a valid UUID' })
  id: string;
}

export class UpdateMerchantPayloadDto extends UpdateMerchantDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;
}

export class CreateDirectorPayloadDto extends CreatePersonDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;
}

export class UpdateDirectorPayloadDto extends UpdatePersonDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;

  @IsUUID('4', { message: 'id must be a valid UUID' })
  id: string;
}

export class CreateAuthorizerPayloadDto extends CreatePersonDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;
}

export class UpdateAuthorizerPayloadDto extends UpdatePersonDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;

  @IsUUID('4', { message: 'id must be a valid UUID' })
  id: string;
}

export class UploadVideoKycPayloadDto extends ClientIdResourcePayloadDto {
  @IsString()
  videoKycUrl: string;
}

export class CreateBankDetailPayloadDto extends CreateBankDetailDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;
}

export class VerifyBankDetailPayloadDto extends VerifyBankDetailDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;
}

export class UpdateBankDetailPayloadDto extends UpdateBankDetailDto {
  @IsUUID('4', { message: 'clientId must be a valid UUID' })
  clientId: string;

  @IsUUID('4', { message: 'id must be a valid UUID' })
  id: string;
}

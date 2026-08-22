import {
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ClientIdPipe, ResourceIdPipe } from '../common/pipes/uuid-param.pipe';
import { MAX_VIDEO_KYC_SIZE_BYTES } from './constants/video-kyc.constants';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { LocalFileStorageService } from './local-file-storage.service';
import { MerchantOnboardingService } from './merchant-onboarding.service';
import {
  assertValidVideoKycFile,
  UploadedVideoPayload,
} from './utils/assert-video-kyc-file';

@Controller('merchant-onboarding/:clientId/directors')
export class DirectorController {
  constructor(
    private readonly merchantOnboardingService: MerchantOnboardingService,
    private readonly localFileStorageService: LocalFileStorageService,
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

  @Post(':id/video-kyc/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_VIDEO_KYC_SIZE_BYTES },
    }),
  )
  async uploadDirectorVideoKyc(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
    @UploadedFile() file: UploadedVideoPayload | undefined,
  ) {
    assertValidVideoKycFile(file);

    try {
      const { fileUrl } = await this.localFileStorageService.saveVideoKycRecording(
        {
          clientId,
          personId: id,
          originalName: file.originalname,
          buffer: file.buffer,
        },
      );

      return await this.merchantOnboardingService.uploadDirectorVideoKyc(
        clientId,
        id,
        fileUrl,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Video KYC upload failed',
      );
    }
  }

  @Post(':id/delete')
  deleteDirector(
    @Param('clientId', ClientIdPipe) clientId: string,
    @Param('id', ResourceIdPipe) id: string,
  ) {
    return this.merchantOnboardingService.deleteDirector(clientId, id);
  }
}

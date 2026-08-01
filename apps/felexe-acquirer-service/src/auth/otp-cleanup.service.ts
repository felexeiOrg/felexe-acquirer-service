import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { OtpVerification } from './entities/otp-verification.entity';
import { AuditEvent } from './enums/audit-event.enum';

@Injectable()
export class OtpCleanupService {
  private readonly logger = new Logger(OtpCleanupService.name);

  constructor(
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
    private readonly auditService: AuditService,
  ) {}

  /** Delete expired OTPs every minute (OTP validity = 10 minutes) */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredOtpCleanup() {
    const deletedCount = await this.deleteExpiredOtps();
    if (deletedCount > 0) {
      this.logger.log(`Deleted ${deletedCount} expired OTP record(s)`);
    }
  }

  /**
   * Removes:
   * - unused OTPs past expires_at (10 min)
   * - used OTPs whose verification token has also expired
   */
  async deleteExpiredOtps(mobile?: string): Promise<number> {
    const now = new Date();

    const qb = this.otpRepository
      .createQueryBuilder()
      .delete()
      .from(OtpVerification)
      .where(
        `(
          (is_used = false AND expires_at < :now)
          OR
          (is_used = true AND (token_expires_at IS NULL OR token_expires_at < :now))
        )`,
        { now },
      );

    if (mobile) {
      qb.andWhere('mobile = :mobile', { mobile });
    }

    const result = await qb.execute();
    const deletedCount = result.affected ?? 0;

    if (deletedCount > 0) {
      await this.auditService.log({
        event: AuditEvent.OTP_EXPIRED_DELETED,
        action: 'DELETE',
        status: 'SUCCESS',
        resource: 'otp_verifications',
        description:
          'Expired OTP records deleted from otp_verifications table after 10-minute validity',
        targetMobile: mobile ?? null,
        metadata: {
          deleted_count: deletedCount,
          cleanup_time: now.toISOString(),
          validity_minutes: 10,
          reason:
            'OTP validity exceeded 10 minutes or verification token expired',
        },
      });
    }

    return deletedCount;
  }

  async deleteById(id: string): Promise<void> {
    await this.otpRepository.delete({ id });
  }
}

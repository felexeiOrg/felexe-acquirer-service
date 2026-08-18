import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpVerification } from './entities/otp-verification.entity';
import { User } from './entities/user.entity';
import { AuditEvent } from './enums/audit-event.enum';
import { OtpPurpose } from './enums/otp-purpose.enum';
import { UserRole } from './enums/user-role.enum';
import { OtpCleanupService } from './otp-cleanup.service';

@Injectable()
export class AuthService {
  private readonly otpTtlMinutes = 10;
  private readonly tokenTtlMinutes = 15;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
    private readonly auditService: AuditService,
    private readonly otpCleanupService: OtpCleanupService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const email = createUserDto.email.toLowerCase().trim();
    const mobile = createUserDto.mobile;

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { mobile }],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or mobile already exists',
      );
    }

    const plainPassword =
      createUserDto.password ??
      this.generateTemporaryPassword(createUserDto.first_name);
    const passwordWasGenerated = !createUserDto.password;
    const password_hash = await bcrypt.hash(plainPassword, 12);

    const user = this.userRepository.create({
      company_name: createUserDto.company_name,
      business_website: createUserDto.business_website ?? null,
      company_type: createUserDto.company_type ?? null,
      role: createUserDto.role ?? UserRole.SYSTEM_ADMIN,
      first_name: createUserDto.first_name,
      last_name: createUserDto.last_name,
      mobile,
      email,
      password_hash,
      is_active: 0,
      must_change_password: true,
      password_change_count: 0,
      password_changed_at: null,
      created_by_admin_id: null,
      created_by_partner_id: null,
      custom_role: createUserDto.custom_role ?? null,
      permissions: createUserDto.permissions ?? [],
    });

    const savedUser = await this.userRepository.save(user);

    await this.auditService.log({
      event: AuditEvent.USER_REGISTERED,
      action: 'CREATE',
      status: 'SUCCESS',
      resource: 'users',
      user: savedUser,
      targetId: savedUser.id,
      targetMobile: savedUser.mobile,
      description: `${savedUser.first_name} ${savedUser.last_name} registered a new account`,
      changedFields: [
        'company_name',
        'first_name',
        'last_name',
        'mobile',
        'email',
        'role',
        'is_active',
        'must_change_password',
        'password_hash',
      ],
      oldValues: null,
      newValues: {
        id: savedUser.id,
        company_name: savedUser.company_name,
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        mobile: savedUser.mobile,
        email: savedUser.email,
        role: savedUser.role,
        is_active: savedUser.is_active,
        must_change_password: savedUser.must_change_password,
        password_generated: passwordWasGenerated,
      },
      metadata: {
        note: 'User self-registration',
        password_generated: passwordWasGenerated,
      },
    });

    return {
      id: savedUser.id,
      company_name: savedUser.company_name,
      business_website: savedUser.business_website,
      company_type: savedUser.company_type,
      role: savedUser.role,
      first_name: savedUser.first_name,
      last_name: savedUser.last_name,
      mobile: savedUser.mobile,
      email: savedUser.email,
      is_active: savedUser.is_active,
      must_change_password: savedUser.must_change_password,
      custom_role: savedUser.custom_role,
      permissions: savedUser.permissions,
      created_at: savedUser.created_at,
      ...(passwordWasGenerated ? { generated_password: plainPassword } : {}),
    };
  }

  async login(loginDto: LoginDto) {
    await this.otpCleanupService.deleteExpiredOtps(loginDto.mobile);

    const user = await this.userRepository.findOne({
      where: { mobile: loginDto.mobile },
    });

    if (!user) {
      await this.auditService.log({
        event: AuditEvent.LOGIN_FAILED,
        action: 'LOGIN',
        status: 'FAILED',
        resource: 'auth',
        mobile: loginDto.mobile,
        targetMobile: loginDto.mobile,
        description: 'Login failed - mobile not registered',
        metadata: { reason: 'USER_NOT_FOUND' },
      });
      throw new UnauthorizedException('Invalid mobile or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      await this.auditService.log({
        event: AuditEvent.LOGIN_FAILED,
        action: 'LOGIN',
        status: 'FAILED',
        resource: 'auth',
        user: user,
        description: `${user.first_name} ${user.last_name} failed login due to invalid password`,
        metadata: { reason: 'INVALID_PASSWORD' },
      });
      throw new UnauthorizedException('Invalid mobile or password');
    }

    await this.auditService.log({
      event: AuditEvent.LOGIN_SUCCESS,
      action: 'LOGIN',
      status: 'SUCCESS',
      resource: 'auth',
      user: user,
      description: `${user.first_name} ${user.last_name} password validated; OTP challenge started`,
      oldValues: {
        is_active: user.is_active,
        must_change_password: user.must_change_password,
      },
      newValues: {
        login_stage: 'OTP_REQUIRED',
        must_change_password: user.must_change_password,
      },
      metadata: {
        next_step: 'VERIFY_OTP',
      },
    });

    const otpResult = await this.createAndSendOtp(user, OtpPurpose.LOGIN);

    return {
      message: 'OTP sent to registered mobile number',
      requires_otp: true,
      purpose: OtpPurpose.LOGIN,
      otp_valid_for_minutes: this.otpTtlMinutes,
      must_change_password: user.must_change_password,
      mobile: user.mobile,
      ...otpResult,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    await this.otpCleanupService.deleteExpiredOtps(forgotPasswordDto.mobile);

    const user = await this.userRepository.findOne({
      where: { mobile: forgotPasswordDto.mobile },
    });

    if (!user) {
      return {
        message: 'If the mobile is registered, an OTP has been sent',
        requires_otp: true,
        purpose: OtpPurpose.FORGOT_PASSWORD,
        otp_valid_for_minutes: this.otpTtlMinutes,
      };
    }

    await this.auditService.log({
      event: AuditEvent.FORGOT_PASSWORD_REQUESTED,
      action: 'REQUEST',
      status: 'SUCCESS',
      resource: 'password',
      user: user,
      description: `${user.first_name} ${user.last_name} requested forgot password`,
      metadata: {
        next_step: 'VERIFY_OTP',
      },
    });

    const otpResult = await this.createAndSendOtp(
      user,
      OtpPurpose.FORGOT_PASSWORD,
    );

    return {
      message: 'If the mobile is registered, an OTP has been sent',
      requires_otp: true,
      purpose: OtpPurpose.FORGOT_PASSWORD,
      otp_valid_for_minutes: this.otpTtlMinutes,
      mobile: user.mobile,
      ...otpResult,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    await this.otpCleanupService.deleteExpiredOtps(verifyOtpDto.mobile);

    const user = await this.userRepository.findOne({
      where: { mobile: verifyOtpDto.mobile },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const otpRecord = await this.otpRepository.findOne({
      where: {
        user_id: user.id,
        mobile: verifyOtpDto.mobile,
        purpose: verifyOtpDto.purpose,
        is_used: false,
        expires_at: MoreThan(new Date()),
      },
      order: { created_at: 'DESC' },
    });

    if (!otpRecord) {
      await this.auditService.log({
        event: AuditEvent.OTP_FAILED,
        action: 'VERIFY',
        status: 'FAILED',
        resource: 'otp_verifications',
        user: user,
        description: `${user.first_name} ${user.last_name} OTP verification failed - missing or expired`,
        metadata: {
          purpose: verifyOtpDto.purpose,
          reason: 'OTP_MISSING_OR_EXPIRED',
          validity_minutes: this.otpTtlMinutes,
        },
      });
      throw new UnauthorizedException(
        'Invalid or expired OTP. OTP is valid for 10 minutes only',
      );
    }

    const isOtpValid = await bcrypt.compare(
      verifyOtpDto.otp,
      otpRecord.otp_hash,
    );

    if (!isOtpValid) {
      await this.auditService.log({
        event: AuditEvent.OTP_FAILED,
        action: 'VERIFY',
        status: 'FAILED',
        resource: 'otp_verifications',
        user: user,
        description: `${user.first_name} ${user.last_name} OTP verification failed - incorrect OTP`,
        metadata: {
          purpose: verifyOtpDto.purpose,
          reason: 'OTP_INCORRECT',
          otp_id: otpRecord.id,
        },
      });
      throw new UnauthorizedException(
        'Invalid or expired OTP. OTP is valid for 10 minutes only',
      );
    }

    const verificationToken = this.generateToken();
    otpRecord.is_used = true;
    otpRecord.verification_token_hash = await bcrypt.hash(
      verificationToken,
      12,
    );
    otpRecord.token_expires_at = new Date(
      Date.now() + this.tokenTtlMinutes * 60 * 1000,
    );
    otpRecord.is_token_used = false;
    await this.otpRepository.save(otpRecord);

    await this.auditService.log({
      event: AuditEvent.OTP_VERIFIED,
      action: 'VERIFY',
      status: 'SUCCESS',
      resource: 'otp_verifications',
      user: user,
      description: `${user.first_name} ${user.last_name} verified OTP successfully`,
      changedFields: ['is_used', 'verification_token_hash', 'token_expires_at'],
      oldValues: { is_used: false },
      newValues: {
        is_used: true,
        purpose: verifyOtpDto.purpose,
        otp_id: otpRecord.id,
      },
      metadata: {
        purpose: verifyOtpDto.purpose,
        otp_id: otpRecord.id,
      },
    });

    const requiresPasswordUpdate =
      verifyOtpDto.purpose === OtpPurpose.FORGOT_PASSWORD ||
      user.must_change_password ||
      user.is_active === 0;

    if (requiresPasswordUpdate) {
      await this.auditService.log({
        event: AuditEvent.PASSWORD_UPDATE_REQUIRED,
        action: 'UPDATE',
        status: 'SUCCESS',
        resource: 'password',
        user: user,
        description: `${user.first_name} ${user.last_name} must update password after OTP verification`,
        oldValues: {
          must_change_password: user.must_change_password,
          is_active: user.is_active,
        },
        newValues: {
          requires_password_update: true,
          purpose: verifyOtpDto.purpose,
        },
        metadata: { purpose: verifyOtpDto.purpose },
      });
    }

    return {
      message: requiresPasswordUpdate
        ? 'OTP verified. Please update your password'
        : 'OTP verified successfully',
      requires_password_update: requiresPasswordUpdate,
      verification_token: verificationToken,
      purpose: verifyOtpDto.purpose,
      mobile: user.mobile,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        must_change_password: user.must_change_password,
      },
    };
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto) {
    await this.otpCleanupService.deleteExpiredOtps(updatePasswordDto.mobile);

    const user = await this.userRepository.findOne({
      where: { mobile: updatePasswordDto.mobile },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    const otpRecord = await this.otpRepository.findOne({
      where: {
        user_id: user.id,
        mobile: updatePasswordDto.mobile,
        is_used: true,
        is_token_used: false,
        token_expires_at: MoreThan(new Date()),
      },
      order: { created_at: 'DESC' },
    });

    if (!otpRecord?.verification_token_hash) {
      throw new UnauthorizedException(
        'Invalid or expired verification token. Please verify OTP again',
      );
    }

    const isTokenValid = await bcrypt.compare(
      updatePasswordDto.verification_token,
      otpRecord.verification_token_hash,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException(
        'Invalid or expired verification token. Please verify OTP again',
      );
    }

    const isSamePassword = await bcrypt.compare(
      updatePasswordDto.new_password,
      user.password_hash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const oldValues = {
      is_active: user.is_active,
      must_change_password: user.must_change_password,
      password_change_count: user.password_change_count,
      password_changed_at: user.password_changed_at,
    };

    user.password_hash = await bcrypt.hash(updatePasswordDto.new_password, 12);
    user.must_change_password = false;
    user.is_active = 1;
    user.password_change_count += 1;
    user.password_changed_at = new Date();
    await this.userRepository.save(user);

    const otpId = otpRecord.id;
    // Remove OTP row after successful password update
    await this.otpCleanupService.deleteById(otpId);

    const event =
      otpRecord.purpose === OtpPurpose.FORGOT_PASSWORD
        ? AuditEvent.FORGOT_PASSWORD_COMPLETED
        : AuditEvent.PASSWORD_UPDATED;

    await this.auditService.log({
      event,
      action: 'UPDATE',
      status: 'SUCCESS',
      resource: 'password',
      user,
      description: `${user.first_name} ${user.last_name} updated password (change #${user.password_change_count})`,
      changedFields: [
        'password_hash',
        'must_change_password',
        'is_active',
        'password_change_count',
        'password_changed_at',
      ],
      oldValues,
      newValues: {
        is_active: user.is_active,
        must_change_password: user.must_change_password,
        password_change_count: user.password_change_count,
        password_changed_at: user.password_changed_at,
        password_hash: '[REDACTED]',
      },
      metadata: {
        purpose: otpRecord.purpose,
        otp_id_deleted: otpId,
        password_change_count: user.password_change_count,
      },
    });

    return {
      message: 'Password updated successfully',
      is_active: user.is_active,
      must_change_password: user.must_change_password,
      password_change_count: user.password_change_count,
      password_changed_at: user.password_changed_at,
    };
  }

  private async createAndSendOtp(user: User, purpose: OtpPurpose) {
    await this.otpCleanupService.deleteExpiredOtps(user.mobile);

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + this.otpTtlMinutes * 60 * 1000);

    const otpRecord = this.otpRepository.create({
      user_id: user.id,
      mobile: user.mobile,
      otp_hash: otpHash,
      purpose,
      expires_at: expiresAt,
      is_used: false,
      verification_token_hash: null,
      token_expires_at: null,
      is_token_used: false,
    });

    await this.otpRepository.save(otpRecord);

    await this.auditService.log({
      event: AuditEvent.OTP_SENT,
      action: 'SEND',
      status: 'SUCCESS',
      resource: 'otp_verifications',
      user: user,
      description: `OTP sent to ${user.mobile} for ${purpose}; valid for ${this.otpTtlMinutes} minutes`,
      changedFields: ['otp_hash', 'expires_at', 'purpose'],
      newValues: {
        otp_id: otpRecord.id,
        purpose,
        expires_at: expiresAt.toISOString(),
        validity_minutes: this.otpTtlMinutes,
      },
      metadata: {
        purpose,
        otp_id: otpRecord.id,
        expires_in_minutes: this.otpTtlMinutes,
      },
    });

    const isDev =
      this.configService.get<string>('NODE_ENV', 'development') !==
      'production';

    return isDev
      ? { dev_otp: otp, otp_expires_at: expiresAt.toISOString() }
      : { otp_expires_at: expiresAt.toISOString() };
  }

  private generateTemporaryPassword(firstName: string): string {
    const cleanedFirstName = firstName.replace(/[^a-zA-Z]/g, '');
    const namePart =
      cleanedFirstName.charAt(0).toUpperCase() +
      cleanedFirstName.slice(1).toLowerCase();
    const specialChars = ['@', '#', '$', '*', '!'];
    const special = specialChars[randomBytes(1)[0] % specialChars.length];
    const fourDigits = randomInt(0, 10000).toString().padStart(4, '0');

    return `${namePart || 'User'}${special}${fourDigits}`;
  }

  private generateOtp(): string {
    return randomInt(0, 1000000).toString().padStart(6, '0');
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}

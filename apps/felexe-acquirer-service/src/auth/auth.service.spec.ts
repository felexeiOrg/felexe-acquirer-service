import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { OtpVerification } from './entities/otp-verification.entity';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { OtpCleanupService } from './otp-cleanup.service';

describe('AuthService', () => {
  let service: AuthService;
  const userRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const otpRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const auditService = {
    log: jest.fn(),
  };
  const otpCleanupService = {
    deleteExpiredOtps: jest.fn().mockResolvedValue(0),
    deleteById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(OtpVerification),
          useValue: otpRepository,
        },
        {
          provide: AuditService,
          useValue: auditService,
        },
        {
          provide: OtpCleanupService,
          useValue: otpCleanupService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('development'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should register system_admin with temp password pattern', async () => {
    userRepository.findOne.mockResolvedValue(null);
    userRepository.create.mockImplementation((data) => data);
    userRepository.save.mockImplementation(async (data) => ({
      ...data,
      id: 'user-id',
      created_at: new Date('2026-01-01'),
    }));

    const result = await service.register({
      company_name: 'Your Company Pvt Ltd',
      business_website: 'https://example.com',
      company_type: 'private_limited',
      first_name: 'Admin',
      last_name: 'User',
      mobile: '9876543210',
      email: 'admin@example.com',
    });

    expect(result.role).toBe(UserRole.SYSTEM_ADMIN);
    expect(result.is_active).toBe(0);
    expect(result.must_change_password).toBe(true);
    expect(result.generated_password).toMatch(/^[A-Za-z]+[@#$*!]\d{4}$/);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        changedFields: expect.arrayContaining(['email', 'mobile']),
      }),
    );
  });

  it('should reject duplicate email/mobile', async () => {
    userRepository.findOne.mockResolvedValue({ id: 'existing' });

    await expect(
      service.register({
        company_name: 'Your Company Pvt Ltd',
        first_name: 'Admin',
        last_name: 'User',
        mobile: '9876543210',
        email: 'admin@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

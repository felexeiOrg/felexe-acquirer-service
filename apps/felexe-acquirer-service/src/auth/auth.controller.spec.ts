import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    verifyOtp: jest.fn(),
    updatePassword: jest.fn(),
    forgotPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should call authService.register', async () => {
    const dto = {
      company_name: 'Your Company Pvt Ltd',
      first_name: 'Admin',
      last_name: 'User',
      mobile: '9876543210',
      email: 'admin@example.com',
    } as CreateUserDto;

    const expected = { id: 'uuid', email: dto.email };
    authService.register.mockResolvedValue(expected);

    await expect(controller.register(dto)).resolves.toEqual(expected);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });
});

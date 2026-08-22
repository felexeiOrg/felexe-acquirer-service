import { User } from '../entities/user.entity';

export interface AuthSessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PublicUserProfile {
  id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  role: string;
  custom_role: string | null;
  permissions: string[];
  is_active: number;
  must_change_password: boolean;
}

export function toPublicUserProfile(user: User): PublicUserProfile {
  return {
    id: user.id,
    company_name: user.company_name,
    first_name: user.first_name,
    last_name: user.last_name,
    mobile: user.mobile,
    email: user.email,
    role: user.role,
    custom_role: user.custom_role,
    permissions: user.permissions ?? [],
    is_active: user.is_active,
    must_change_password: user.must_change_password,
  };
}

export interface LoginSuccessResponse {
  message: string;
  token_type: 'Bearer';
  expires_in: number;
  user: PublicUserProfile;
}

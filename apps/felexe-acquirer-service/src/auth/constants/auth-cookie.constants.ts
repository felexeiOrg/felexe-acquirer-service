export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  VERIFICATION_TOKEN: 'verification_token',
} as const;

export const AUTH_COOKIE_PATHS = {
  API: '/v2/api',
  AUTH: '/v2/api/auth',
} as const;

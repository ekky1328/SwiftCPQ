import type { Response } from 'express';

const IS_PROD = process.env.NODE_ENV === 'production';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: IS_PROD,
  path: '/',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('access_token', accessToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refresh_token', refreshToken, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', BASE_COOKIE_OPTIONS);
  res.clearCookie('refresh_token', BASE_COOKIE_OPTIONS);
}

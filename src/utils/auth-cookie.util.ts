import { Response } from 'express';
import env from '@config/env';
import { parseExpiresInToMs } from '@utils/token-expiry.util';

const cookieName = () => env.REFRESH_COOKIE_NAME;

const secureCookie = () => env.NODE_ENV === 'production';

/** Path must match clearCookie. Use `/` so mobile clients send the cookie on all API routes. */
const COOKIE_PATH = '/';

export function setRefreshTokenCookie(res: Response, plainToken: string, rememberMe: boolean): void {
  const ttl = rememberMe
    ? parseExpiresInToMs(env.JWT_REFRESH_EXPIRE_REMEMBER)
    : parseExpiresInToMs(env.JWT_REFRESH_EXPIRE_SESSION);
  res.cookie(cookieName(), plainToken, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: ttl,
  });
}

export function setRefreshTokenCookieWithMaxAgeMs(res: Response, plainToken: string, maxAgeMs: number): void {
  res.cookie(cookieName(), plainToken, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'lax',
    path: COOKIE_PATH,
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(cookieName(), {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'lax',
  });
}

export function readRefreshTokenFromRequest(req: { cookies?: Record<string, string>; body?: any }): string | undefined {
  const fromCookie = req.cookies?.[cookieName()];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie;
  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === 'string' && fromBody.length > 0) return fromBody;
  return undefined;
}

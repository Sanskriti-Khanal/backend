import { randomUUID } from 'crypto';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import env from '@config/env';
import { BadRequestError } from '@errors/AppError';
import { PasswordSetIntentModel } from '@models/PasswordSetIntent.model';
import { normalizePemFromEnv } from '@utils/jwt.util';
import { parseExpiresInToMs } from '@utils/token-expiry.util';

const TYP = 'password_set' as const;

/**
 * One-time, short-lived JWT after successful /users/verify-otp (Twilio/stored OTP consumed there).
 * Allows set-password / auth reset without a second provider verification.
 */
export class PasswordSetTokenService {
  async issueForUserId(userId: string): Promise<string> {
    const uid = new Types.ObjectId(userId);
    await PasswordSetIntentModel.updateMany(
      { userId: uid, used: false },
      { $set: { used: true } }
    );
    const jti = randomUUID();
    const expMs = parseExpiresInToMs(env.JWT_PASSWORD_SET_EXPIRE);
    const expiresAt = new Date(Date.now() + expMs);
    await PasswordSetIntentModel.create({ jti, userId: uid, used: false, expiresAt });

    const privateKey = normalizePemFromEnv(env.JWT_PRIVATE_KEY);
    return jwt.sign({ typ: TYP, sub: userId, jti }, privateKey, {
      algorithm: 'RS256',
      expiresIn: env.JWT_PASSWORD_SET_EXPIRE,
    } as SignOptions);
  }

  async verifyAndConsume(token: string): Promise<string> {
    const trimmed = (token || '').trim();
    if (!trimmed) {
      throw new BadRequestError('passwordSetToken is required');
    }
    const publicKey = normalizePemFromEnv(env.JWT_PUBLIC_KEY);
    let payload: JwtPayload;
    try {
      const decoded = jwt.verify(trimmed, publicKey, { algorithms: ['RS256'] });
      if (typeof decoded === 'string' || !decoded || typeof (decoded as JwtPayload).jti === 'undefined') {
        throw new BadRequestError('Invalid password-set token');
      }
      payload = decoded as JwtPayload;
      if (payload.typ !== TYP) {
        throw new BadRequestError('Invalid password-set token');
      }
    } catch (e) {
      if (e instanceof BadRequestError) throw e;
      throw new BadRequestError('Invalid or expired password-set token');
    }
    const jti = String(payload.jti);
    const sub = String(payload.sub);
    if (!/^[a-f0-9]{24}$/i.test(sub)) {
      throw new BadRequestError('Invalid password-set token');
    }
    const doc = await PasswordSetIntentModel.findOneAndUpdate(
      { jti, used: false, expiresAt: { $gt: new Date() } },
      { $set: { used: true } },
      { new: true }
    );
    if (!doc) {
      throw new BadRequestError('This password-set link is no longer valid. Please verify OTP again.');
    }
    return sub;
  }
}

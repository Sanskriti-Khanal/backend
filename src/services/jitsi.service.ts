import jwt from 'jsonwebtoken';
import env from '@config/env';
import { BadRequestError } from '@errors/AppError';

interface GenerateJitsiTokenInput {
  room: string;
  userId: string;
  role: string;
  phone: string;
  displayName?: string;
  moderator?: boolean;
}

export class JitsiService {
  generateMeetingToken(input: GenerateJitsiTokenInput) {
    if (!env.JITSI_DOMAIN || !env.JITSI_APP_ID || !env.JITSI_APP_SECRET) {
      throw new BadRequestError('Jitsi token service is not configured on server');
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = env.JITSI_TOKEN_TTL_SECONDS;

    const payload = {
      aud: 'jitsi',
      iss: env.JITSI_APP_ID,
      sub: env.JITSI_DOMAIN,
      room: input.room,
      nbf: now - 10,
      iat: now,
      exp: now + expiresIn,
      context: {
        user: {
          id: input.userId,
          name: input.displayName || input.phone,
          moderator: input.moderator === true ? 'true' : 'false',
        },
        app: {
          name: 'MeroSathi',
          role: input.role,
        },
      },
    };

    const token = jwt.sign(payload, env.JITSI_APP_SECRET, {
      algorithm: 'HS256',
    });

    return {
      token,
      domain: env.JITSI_DOMAIN,
      room: input.room,
      expiresIn,
    };
  }
}

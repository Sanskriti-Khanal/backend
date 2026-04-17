import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '@config/env';
import { normalizePemFromEnv } from '@utils/jwt.util';
import { UnauthorizedError, ForbiddenError } from '@errors/AppError';
import { UserRole } from '@types';
import { isBlacklisted } from '@services/token-blacklist.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    phone: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    if (isBlacklisted(token)) {
      throw new UnauthorizedError('Token has been revoked (logged out)');
    }
    const publicKey = normalizePemFromEnv(env.JWT_PUBLIC_KEY);
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as {
      id: string;
      role: string | UserRole;
      phone: string;
    };

    // Normalize role to ensure it matches UserRole enum
    // Handle both string and enum types, and normalize to lowercase
    let roleValue: string;
    if (typeof decoded.role === 'string') {
      roleValue = decoded.role.toLowerCase().trim();
    } else {
      roleValue = String(decoded.role).toLowerCase().trim();
    }

    // Legacy tokens issued before role rename still carry pujari / pandit
    const legacyJwtRoleMap: Record<string, UserRole> = {
      pujari: UserRole.JYOTISH,
      pandit: UserRole.VAASTU,
    };
    if (legacyJwtRoleMap[roleValue]) {
      roleValue = legacyJwtRoleMap[roleValue];
    }

    const validRoles: UserRole[] = [
      UserRole.USER,
      UserRole.HEALER,
      UserRole.JYOTISH,
      UserRole.PREMIUM_JYOTISH,
      UserRole.VAASTU,
      UserRole.ADMIN,
    ];

    const normalizedRole = validRoles.find(
      (enumRole) => enumRole.toLowerCase() === roleValue
    );

    if (!normalizedRole) {
      throw new UnauthorizedError(
        `Userrole unknown: "${decoded.role}" (normalized: "${roleValue}"). Valid roles are: ${validRoles.join(', ')}`
      );
    }

    req.user = {
      id: decoded.id,
      role: normalizedRole,
      phone: decoded.phone,
    };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};


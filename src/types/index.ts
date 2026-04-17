import { Request } from 'express';

export enum UserRole {
  USER = 'user',
  HEALER = 'healer',
  JYOTISH = 'jyotish',
  PREMIUM_JYOTISH = 'premium_jyotish',
  VAASTU = 'vaastu',
  ADMIN = 'admin',
}

/** Experts who share consultation (book/chat/call), notes, and puja provider APIs */
export const CONSULTATION_EXPERT_ROLES: UserRole[] = [
  UserRole.JYOTISH,
  UserRole.PREMIUM_JYOTISH,
  UserRole.VAASTU,
];

export function isConsultationExpertRole(
  role: UserRole | string | undefined | null
): boolean {
  if (role == null) return false;
  const r =
    typeof role === 'string'
      ? role.toLowerCase().trim()
      : String(role).toLowerCase().trim();
  return (
    r === UserRole.JYOTISH ||
    r === UserRole.PREMIUM_JYOTISH ||
    r === UserRole.VAASTU ||
    r === 'pujari' ||
    r === 'pandit'
  );
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    phone?: string;
  };
}

import { Request } from 'express';

export enum UserRole {
  USER = 'user',
  HEALER = 'healer',
  JYOTISH = 'jyotish',
  PUJARI = 'pujari',
  PANDIT = 'pandit',
  ADMIN = 'admin',
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    phone?: string;
  };
}


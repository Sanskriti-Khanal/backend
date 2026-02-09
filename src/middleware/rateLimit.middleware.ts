import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import env from '@config/env';

// Custom key generator that extracts IP from socket connection directly
// This bypasses Express's `trust proxy` setting to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY
// We use req.socket.remoteAddress which is the actual TCP connection IP, not spoofable headers
const getClientIp = (req: Request): string => {
  // Use socket.remoteAddress which is the actual connection IP, not affected by trust proxy
  const socketIp = req.socket?.remoteAddress;
  if (socketIp) {
    // Remove IPv6 prefix if present
    return socketIp.replace(/^::ffff:/, '');
  }
  // Fallback to req.ip if socket IP is not available
  return req.ip || 'unknown';
};

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use custom keyGenerator to extract IP from socket, bypassing trust proxy
  keyGenerator: getClientIp,
  skip: (req) => {
    // In non-production environments, disable global API rate limiting to make local development easier
    if (env.NODE_ENV !== 'production') {
      return true;
    }
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/v1/health';
  },
});

// Strict rate limit for payment endpoints
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many payment requests, please try again later.',
    },
  },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
});

// Login rate limit
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs (production)
  message: {
    success: false,
    error: {
      message: 'Too many login attempts, please try again later.',
    },
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  // In non-production, don't rate-limit login so testing isn't blocked
  skip: () => env.NODE_ENV !== 'production',
});

// Very strict rate limit for webhook endpoints (prevent abuse)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 webhook requests per minute
  message: {
    success: false,
    error: {
      message: 'Too many webhook requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
});


import type { RequestHandler } from 'express';
import type { UserRole } from '@mindbridge/shared';
import { forbidden, unauthorized } from './errors.js';
import { verifyAccessToken } from './tokens.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();
  try {
    const claims = verifyAccessToken(header.slice(7));
    req.auth = { userId: claims.sub, role: claims.role };
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.');
  }
  next();
};

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) throw unauthorized();
    if (!roles.includes(req.auth.role)) throw forbidden();
    next();
  };

/** Returns the authenticated user id or throws — use inside handlers behind requireAuth. */
export function authUserId(req: Express.Request): string {
  if (!req.auth) throw unauthorized();
  return req.auth.userId;
}

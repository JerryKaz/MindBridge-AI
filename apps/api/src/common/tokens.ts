import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessClaims {
  sub: string;
}

const ISSUER = 'mindbridge-api';

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: claims.sub,
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    issuer: ISSUER,
    audience: 'mindbridge-clients',
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: ISSUER,
    audience: 'mindbridge-clients',
    algorithms: ['HS256'],
  });
  if (typeof payload === 'string' || !payload.sub) {
    throw new Error('Malformed token');
  }
  return { sub: payload.sub };
}

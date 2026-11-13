import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/common/tokens.js';

/**
 * HTTP-layer tests that do not need a database: authentication, authorisation,
 * validation, error handling and security headers.
 */
const app = createApp();
const studentToken = signAccessToken({ sub: '64b7f0c2a1b2c3d4e5f60718', role: 'STUDENT' });

describe('HTTP security boundary', () => {
  it('sets secure headers and hides the framework', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('reports degraded health when the database is not connected', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ db: 'down', aiProvider: 'rule-based' });
  });

  it('scenario 9a: rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/conversations');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('scenario 9b: rejects an expired token', async () => {
    const expired = jwt.sign({ role: 'STUDENT' }, process.env.JWT_ACCESS_SECRET!, {
      subject: '64b7f0c2a1b2c3d4e5f60718',
      issuer: 'mindbridge-api',
      audience: 'mindbridge-clients',
      expiresIn: -10,
    });
    const res = await request(app).get('/api/v1/students/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/expired/i);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = jwt.sign({ role: 'ADMIN' }, 'x'.repeat(40), { subject: 'a', issuer: 'mindbridge-api', audience: 'mindbridge-clients' });
    const res = await request(app).get('/api/v1/admin/analytics').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('forbids students from admin endpoints', async () => {
    const res = await request(app).get('/api/v1/admin/analytics').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('validates registration input before touching the database', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(
      expect.arrayContaining(['email', 'password', 'displayName', 'acceptedTerms']),
    );
  });

  it('rejects malformed JSON and NoSQL operator payloads', async () => {
    const bad = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(bad.status).toBe(400);
    const op = await request(app).post('/api/v1/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(op.status).toBe(400);
  });

  it('rejects malformed ids and over-long messages', async () => {
    const badId = await request(app)
      .post('/api/v1/conversations/not-an-id/messages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'hi' });
    expect(badId.status).toBe(400);
    const long = await request(app)
      .post('/api/v1/conversations/64b7f0c2a1b2c3d4e5f60718/messages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'x'.repeat(2001) });
    expect(long.status).toBe(400);
  });

  it('rejects oversized bodies', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(40_000) });
    expect(res.status).toBe(413);
  });
});

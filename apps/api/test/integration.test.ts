import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';
import { UserModel } from '../src/modules/students/user.model.js';

/**
 * End-to-end API tests against a real MongoDB. Runs when TEST_MONGODB_URI is
 * set (CI provides a MongoDB service container). The database is dropped.
 */
const uri = process.env.TEST_MONGODB_URI;
const app = createApp();
const api = '/api/v1';

async function registerStudent(email: string) {
  const res = await request(app)
    .post(`${api}/auth/register`)
    .send({ email, password: 'studyhard2026', displayName: email.split('@')[0], acceptedTerms: true });
  expect(res.status).toBe(201);
  const token = res.body.tokens.accessToken as string;
  await request(app)
    .put(`${api}/consents`)
    .set('Authorization', `Bearer ${token}`)
    .send({ consents: [{ type: 'AI_PROCESSING', granted: true }] })
    .expect(200);
  return { token, refreshToken: res.body.tokens.refreshToken as string, id: res.body.user.id as string };
}

describe.skipIf(!uri)('API integration (MongoDB)', () => {
  beforeAll(async () => {
    await mongoose.connect(uri!);
    await mongoose.connection.dropDatabase();
    await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('registers, logs in, rotates refresh tokens and detects reuse', async () => {
    const s = await registerStudent('ama@example.com');
    await request(app).post(`${api}/auth/register`).send({ email: 'ama@example.com', password: 'studyhard2026', displayName: 'A', acceptedTerms: true }).expect(409);
    const bad = await request(app).post(`${api}/auth/login`).send({ email: 'ama@example.com', password: 'wrongpassword1' });
    expect(bad.status).toBe(401);
    const rotated = await request(app).post(`${api}/auth/refresh`).send({ refreshToken: s.refreshToken }).expect(200);
    // Reusing the old token revokes the family, including the new token.
    await request(app).post(`${api}/auth/refresh`).send({ refreshToken: s.refreshToken }).expect(401);
    await request(app).post(`${api}/auth/refresh`).send({ refreshToken: rotated.body.tokens.refreshToken }).expect(401);
  });

  it('runs the AI pipeline end to end and encrypts messages at rest', async () => {
    const s = await registerStudent('kofi@example.com');
    const conv = await request(app).post(`${api}/conversations`).set('Authorization', `Bearer ${s.token}`).send({}).expect(201);
    const msg = await request(app)
      .post(`${api}/conversations/${conv.body.id}/messages`)
      .set('Authorization', `Bearer ${s.token}`)
      .send({ content: 'I am so stressed about my exams next week' })
      .expect(201);
    expect(msg.body.trace.intent.label).toBe('ACADEMIC_STRESS');
    expect(msg.body.reply.role).toBe('assistant');

    const raw = await mongoose.connection.collection('messages').findOne({ conversation: new mongoose.Types.ObjectId(conv.body.id) });
    expect(raw?.contentEnc).toMatch(/^v1:/);
    expect(JSON.stringify(raw)).not.toContain('stressed');

    const detail = await request(app).get(`${api}/conversations/${conv.body.id}`).set('Authorization', `Bearer ${s.token}`).expect(200);
    expect(detail.body.messages).toHaveLength(2);
    expect(detail.body.title).toBe('Academic pressure');
  });

  it("scenario 8: a student cannot read, post to or delete another student's conversation", async () => {
    const owner = await registerStudent('owner@example.com');
    const intruder = await registerStudent('intruder@example.com');
    const conv = await request(app).post(`${api}/conversations`).set('Authorization', `Bearer ${owner.token}`).send({}).expect(201);
    const auth = { Authorization: `Bearer ${intruder.token}` };
    await request(app).get(`${api}/conversations/${conv.body.id}`).set(auth).expect(404);
    await request(app).post(`${api}/conversations/${conv.body.id}/messages`).set(auth).send({ content: 'hi' }).expect(404);
    await request(app).delete(`${api}/conversations/${conv.body.id}`).set(auth).expect(404);
    const list = await request(app).get(`${api}/conversations`).set(auth).expect(200);
    expect(list.body).toHaveLength(0);
  });

  it('requires AI processing consent before chatting', async () => {
    const res = await request(app)
      .post(`${api}/auth/register`)
      .send({ email: 'noconsent@example.com', password: 'studyhard2026', displayName: 'N', acceptedTerms: true });
    const token = res.body.tokens.accessToken;
    const conv = await request(app).post(`${api}/conversations`).set('Authorization', `Bearer ${token}`).send({});
    const msg = await request(app).post(`${api}/conversations/${conv.body.id}/messages`).set('Authorization', `Bearer ${token}`).send({ content: 'hello' });
    expect(msg.status).toBe(403);
    expect(msg.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('tracks moods privately per student', async () => {
    const a = await registerStudent('mood-a@example.com');
    const b = await registerStudent('mood-b@example.com');
    const entry = await request(app).post(`${api}/moods`).set('Authorization', `Bearer ${a.token}`).send({ mood: 'STRESSED', intensity: 4, journal: 'exam tomorrow' }).expect(201);
    const hist = await request(app).get(`${api}/moods/history?range=week`).set('Authorization', `Bearer ${a.token}`).expect(200);
    expect(hist.body.entries[0].journal).toBe('exam tomorrow');
    const other = await request(app).get(`${api}/moods/history`).set('Authorization', `Bearer ${b.token}`).expect(200);
    expect(other.body.entries).toHaveLength(0);
    await request(app).delete(`${api}/moods/${entry.body.id}`).set('Authorization', `Bearer ${b.token}`).expect(404);
  });

  it('only shows verified, published support resources and audits admin actions', async () => {
    await UserModel.create({ email: 'admin@example.com', passwordHash: await hashPassword('adminpass2026'), displayName: 'Admin', role: 'ADMIN' });
    const login = await request(app).post(`${api}/auth/admin/login`).send({ email: 'admin@example.com', password: 'adminpass2026' }).expect(200);
    const admin = { Authorization: `Bearer ${login.body.tokens.accessToken}` };

    // Cannot publish unverified
    await request(app).post(`${api}/admin/support-resources`).set(admin)
      .send({ name: 'Test Counselling Unit', category: 'UNIVERSITY_COUNSELLING', description: 'Synthetic test resource', published: true })
      .expect(400);
    const created = await request(app).post(`${api}/admin/support-resources`).set(admin)
      .send({ name: 'Test Counselling Unit', category: 'UNIVERSITY_COUNSELLING', description: 'Synthetic test resource' })
      .expect(201);

    const s = await registerStudent('reader@example.com');
    const before = await request(app).get(`${api}/support/resources`).set('Authorization', `Bearer ${s.token}`).expect(200);
    expect(before.body).toHaveLength(0);

    await request(app).put(`${api}/admin/support-resources/${created.body.id}`).set(admin)
      .send({ verificationStatus: 'VERIFIED', verificationSource: 'Phoned the unit on 2026-11-10', published: true })
      .expect(200);
    const after = await request(app).get(`${api}/support/resources`).set('Authorization', `Bearer ${s.token}`).expect(200);
    expect(after.body).toHaveLength(1);

    const audit = await request(app).get(`${api}/admin/audit-logs`).set(admin).expect(200);
    expect(audit.body.items.map((i: { action: string }) => i.action)).toEqual(
      expect.arrayContaining(['SUPPORT_RESOURCE_CREATED', 'SUPPORT_RESOURCE_VERIFIED']),
    );

    const analytics = await request(app).get(`${api}/admin/analytics`).set(admin).expect(200);
    expect(analytics.body.totals.students).toBeGreaterThan(0);
    expect(JSON.stringify(analytics.body)).not.toMatch(/@example\.com/);
  });

  it('exports and fully deletes a student account', async () => {
    const s = await registerStudent('leaving@example.com');
    const conv = await request(app).post(`${api}/conversations`).set('Authorization', `Bearer ${s.token}`).send({});
    await request(app).post(`${api}/conversations/${conv.body.id}/messages`).set('Authorization', `Bearer ${s.token}`).send({ content: 'feeling a bit low' });
    const exp = await request(app).post(`${api}/privacy/data-export`).set('Authorization', `Bearer ${s.token}`).expect(200);
    expect(exp.body.conversations[0].messages[0].content).toBe('feeling a bit low');

    await request(app).post(`${api}/privacy/account-deletion`).set('Authorization', `Bearer ${s.token}`).send({ password: 'studyhard2026', confirm: 'DELETE' }).expect(204);
    const id = new mongoose.Types.ObjectId(s.id);
    expect(await mongoose.connection.collection('users').countDocuments({ _id: id })).toBe(0);
    expect(await mongoose.connection.collection('messages').countDocuments({ student: id })).toBe(0);
    expect(await mongoose.connection.collection('conversations').countDocuments({ student: id })).toBe(0);
  });
});

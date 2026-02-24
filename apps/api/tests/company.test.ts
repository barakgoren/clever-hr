import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { loginAs, authHeader } from './helpers';

let adminToken: string;
let userToken: string;

beforeAll(async () => {
  const admin = await loginAs('admin@test-co.com');
  adminToken = admin.accessToken;
  const user = await loginAs('user@test-co.com');
  userToken = user.accessToken;
});

describe('GET /api/company', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/company');
    expect(res.status).toBe(401);
  });

  it('returns company info', async () => {
    const res = await request(app).get('/api/company').set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('test-co');
    expect(res.body.data.name).toBe('Test Co');
  });
});

describe('PATCH /api/company', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .patch('/api/company')
      .set(authHeader(userToken))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('updates company name', async () => {
    const res = await request(app)
      .patch('/api/company')
      .set(authHeader(adminToken))
      .send({ name: 'Test Co Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Test Co Updated');

    // Restore name
    await request(app)
      .patch('/api/company')
      .set(authHeader(adminToken))
      .send({ name: 'Test Co' });
  });

  it('rejects invalid slug format', async () => {
    const res = await request(app)
      .patch('/api/company')
      .set(authHeader(adminToken))
      .send({ slug: 'Invalid Slug!' });
    expect(res.status).toBe(400);
  });
});

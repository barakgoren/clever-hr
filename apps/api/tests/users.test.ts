import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { loginAs, authHeader } from './helpers';

let adminToken: string;
let userToken: string;
let newUserId: number;

beforeAll(async () => {
  const admin = await loginAs('admin@test-co.com');
  adminToken = admin.accessToken;
  const user = await loginAs('user@test-co.com');
  userToken = user.accessToken;
});

describe('GET /api/users', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns users list', async () => {
    const res = await request(app).get('/api/users').set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });
});

describe('POST /api/users', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/users')
      .set(authHeader(userToken))
      .send({ name: 'X', username: 'x', email: 'x@x.com', password: 'password123' });
    expect(res.status).toBe(403);
  });

  it('creates a new user as admin', async () => {
    const res = await request(app)
      .post('/api/users')
      .set(authHeader(adminToken))
      .send({
        name: 'New Member',
        username: 'newmember',
        email: 'newmember@test-co.com',
        password: 'password123',
        role: 'user',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('newmember@test-co.com');
    expect(res.body.data.passwordHash).toBeUndefined(); // never exposed
    newUserId = res.body.data.id;
  });

  it('returns 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/users')
      .set(authHeader(adminToken))
      .send({
        name: 'Dupe',
        username: 'dupeuser',
        email: 'newmember@test-co.com',
        password: 'password123',
      });
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/users/:id', () => {
  it('updates user name', async () => {
    const res = await request(app)
      .patch(`/api/users/${newUserId}`)
      .set(authHeader(adminToken))
      .send({ name: 'Updated Member' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Member');
  });
});

describe('DELETE /api/users/:id', () => {
  it('returns 400 when trying to delete own account', async () => {
    // Get the admin's own id from the login response
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test-co.com', password: 'password123' });
    const adminId = loginRes.body.data.user.id;

    const res = await request(app)
      .delete(`/api/users/${adminId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(400);
  });

  it('deletes the created user', async () => {
    const res = await request(app)
      .delete(`/api/users/${newUserId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
  });
});

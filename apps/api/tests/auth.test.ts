import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

let refreshTokenCookie: string;
let accessToken: string;

describe('POST /api/auth/login', () => {
  it('returns 400 for missing body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test-co.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test-co.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('logs in successfully and returns accessToken + sets refreshToken cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test-co.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@test-co.com');
    expect(res.body.data.user.role).toBe('admin');
    expect(res.headers['set-cookie']).toBeDefined();

    accessToken = res.body.data.accessToken;
    refreshTokenCookie = res.headers['set-cookie'][0];
  });
});

describe('POST /api/auth/refresh', () => {
  beforeAll(async () => {
    if (!refreshTokenCookie) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test-co.com', password: 'password123' });
      refreshTokenCookie = res.headers['set-cookie'][0];
    }
  });

  it('returns 401 with no cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('issues a new access token with valid refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined(); // rotated cookie
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the refresh token cookie', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test-co.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', login.headers['set-cookie'][0]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});

export { accessToken };

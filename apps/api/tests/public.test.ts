import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { loginAs, authHeader } from './helpers';
import prisma from '../src/lib/prisma';

let roleId: number;

beforeAll(async () => {
  // Create an active role for public access tests
  const { accessToken } = await loginAs('admin@test-co.com');
  const res = await request(app)
    .post('/api/roles')
    .set(authHeader(accessToken))
    .send({
      name: 'Public Test Role',
      description: 'A role visible on the public board',
      location: 'Tel Aviv',
      type: 'full_time',
      seniorityLevel: 'Mid',
      requirements: ['React', 'TypeScript'],
      customFields: [
        { id: 'phone', label: 'Phone', type: 'tel', required: false },
      ],
    });
  roleId = res.body.data.id;
});

afterAll(async () => {
  await prisma.application.deleteMany({ where: { roleId } });
  await prisma.role.deleteMany({ where: { id: roleId } });
});

describe('GET /api/public/:companySlug', () => {
  it('returns 404 for unknown slug', async () => {
    const res = await request(app).get('/api/public/nonexistent-company-xyz');
    expect(res.status).toBe(404);
  });

  it('returns company info and active roles', async () => {
    const res = await request(app).get('/api/public/test-co');
    expect(res.status).toBe(200);
    expect(res.body.data.company.slug).toBe('test-co');
    expect(Array.isArray(res.body.data.roles)).toBe(true);
    const role = res.body.data.roles.find((r: { id: number }) => r.id === roleId);
    expect(role).toBeDefined();
    expect(role.name).toBe('Public Test Role');
  });
});

describe('GET /api/public/:companySlug/roles/:roleId', () => {
  it('returns role details with customFields', async () => {
    const res = await request(app).get(`/api/public/test-co/roles/${roleId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(roleId);
    expect(res.body.data.customFields).toHaveLength(1);
    expect(res.body.data.requirements).toContain('React');
  });

  it('returns 404 for wrong role id', async () => {
    const res = await request(app).get('/api/public/test-co/roles/99999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/public/:companySlug/roles/:roleId/apply', () => {
  it('returns 400 if full_name or email missing', async () => {
    const res = await request(app)
      .post(`/api/public/test-co/roles/${roleId}/apply`)
      .field('email', 'applicant@example.com');
    expect(res.status).toBe(400);
  });

  it('submits an application successfully (no file)', async () => {
    const res = await request(app)
      .post(`/api/public/test-co/roles/${roleId}/apply`)
      .field('full_name', 'Jane Doe')
      .field('email', 'jane@example.com')
      .field('phone', '0501234567');

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
  });
});

describe('GET /api/applications (dashboard, requires auth)', () => {
  it('lists applications with role info', async () => {
    const { accessToken } = await loginAs('admin@test-co.com');
    const res = await request(app)
      .get('/api/applications')
      .set(authHeader(accessToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // The application we just submitted should be here
    const app_ = res.body.data.find(
      (a: { role: { id: number } }) => a.role.id === roleId
    );
    expect(app_).toBeDefined();
  });
});

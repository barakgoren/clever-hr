import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { loginAs, authHeader } from './helpers';

let adminToken: string;
let userToken: string;
let createdRoleId: number;

beforeAll(async () => {
  const admin = await loginAs('admin@test-co.com');
  adminToken = admin.accessToken;
  const user = await loginAs('user@test-co.com');
  userToken = user.accessToken;
});

describe('GET /api/roles', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/roles');
    expect(res.status).toBe(401);
  });

  it('returns roles list for authenticated user', async () => {
    const res = await request(app).get('/api/roles').set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/roles', () => {
  it('returns 400 for invalid body', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set(authHeader(adminToken))
      .send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('creates a role successfully', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set(authHeader(adminToken))
      .send({
        name: 'Senior Engineer',
        description: 'A great role',
        location: 'Remote',
        type: 'remote',
        seniorityLevel: 'Senior',
        requirements: ['5+ years TypeScript', 'Node.js experience'],
        customFields: [
          { id: 'phone', label: 'Phone', type: 'tel', required: true },
          { id: 'note', label: 'Personal Note', type: 'text' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Senior Engineer');
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.customFields).toHaveLength(2);
    createdRoleId = res.body.data.id;
  });
});

describe('GET /api/roles/:id', () => {
  it('returns the role by id', async () => {
    const res = await request(app)
      .get(`/api/roles/${createdRoleId}`)
      .set(authHeader(userToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdRoleId);
  });

  it('returns 404 for non-existent role', async () => {
    const res = await request(app).get('/api/roles/99999').set(authHeader(adminToken));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/roles/:id', () => {
  it('updates role name', async () => {
    const res = await request(app)
      .patch(`/api/roles/${createdRoleId}`)
      .set(authHeader(adminToken))
      .send({ name: 'Updated Engineer' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Engineer');
  });
});

describe('PATCH /api/roles/:id/active', () => {
  it('toggles the active status', async () => {
    const res = await request(app)
      .patch(`/api/roles/${createdRoleId}/active`)
      .set(authHeader(adminToken))
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);

    // Restore
    await request(app)
      .patch(`/api/roles/${createdRoleId}/active`)
      .set(authHeader(adminToken))
      .send({ isActive: true });
  });
});

describe('Stages /api/roles/:roleId/stages', () => {
  let stageId: number;

  it('creates a stage', async () => {
    const res = await request(app)
      .post(`/api/roles/${createdRoleId}/stages`)
      .set(authHeader(adminToken))
      .send({ name: 'Phone Screen', order: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Phone Screen');
    stageId = res.body.data.id;
  });

  it('lists stages for a role', async () => {
    const res = await request(app)
      .get(`/api/roles/${createdRoleId}/stages`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('updates a stage name', async () => {
    const res = await request(app)
      .patch(`/api/roles/${createdRoleId}/stages/${stageId}`)
      .set(authHeader(adminToken))
      .send({ name: 'Technical Screen' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Technical Screen');
  });

  it('deletes a stage', async () => {
    const res = await request(app)
      .delete(`/api/roles/${createdRoleId}/stages/${stageId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/roles/:id', () => {
  it('deletes the role (no applications)', async () => {
    const res = await request(app)
      .delete(`/api/roles/${createdRoleId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
  });
});

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { loginAs, authHeader } from './helpers';
import prisma from '../src/lib/prisma';

// Mock S3 so no real uploads/downloads happen in tests
vi.mock('../src/services/s3.service', () => ({
  s3Service: {
    upload: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    getPresignedUrl: vi.fn().mockResolvedValue('https://mock-presigned-url.example.com/file'),
    getPutPresignedUrl: vi.fn().mockResolvedValue('https://mock-put-url.example.com/file'),
    publicUrl: vi.fn((key: string) => `https://mock-public.example.com/${key}`),
    keys: {
      applicationFile: (companyId: number, applicationId: number, fieldId: string, filename: string) =>
        `companies/${companyId}/applications/${applicationId}/${fieldId}/${filename}`,
      heroImage: (companyId: number, filename: string) =>
        `companies/${companyId}/assets/hero/${filename}`,
      logoImage: (companyId: number, filename: string) =>
        `companies/${companyId}/assets/logo/${filename}`,
    },
  },
}));

let adminToken: string;
let roleId: number;
let stageId: number;
let otherRoleId: number;
let otherStageId: number;
let applicationId: number;

beforeAll(async () => {
  const admin = await loginAs('admin@test-co.com');
  adminToken = admin.accessToken;

  // Create the primary role with a stage
  const roleRes = await request(app)
    .post('/api/roles')
    .set(authHeader(adminToken))
    .send({
      name: 'App Test Role',
      type: 'full_time',
      location: 'Remote',
      requirements: [],
      customFields: [],
    });
  roleId = roleRes.body.data.id;

  // Get an existing stage from the role (default stages are created)
  const stagesRes = await request(app)
    .get(`/api/roles/${roleId}/stages`)
    .set(authHeader(adminToken));
  stageId = stagesRes.body.data[0].id;

  // Create a second role with a stage (for "wrong role" tests)
  const otherRoleRes = await request(app)
    .post('/api/roles')
    .set(authHeader(adminToken))
    .send({
      name: 'Other Role',
      type: 'remote',
      location: 'Tel Aviv',
      requirements: [],
      customFields: [],
    });
  otherRoleId = otherRoleRes.body.data.id;

  const otherStagesRes = await request(app)
    .get(`/api/roles/${otherRoleId}/stages`)
    .set(authHeader(adminToken));
  otherStageId = otherStagesRes.body.data[0].id;

  // Submit an application to the primary role
  const applyRes = await request(app)
    .post(`/api/public/test-co/roles/${roleId}/apply`)
    .field('full_name', 'Alice Tester')
    .field('email', 'alice@test.com');
  applicationId = applyRes.body.data.id;
});

afterAll(async () => {
  await prisma.applicationTimeline.deleteMany({ where: { application: { roleId: { in: [roleId, otherRoleId] } } } });
  await prisma.application.deleteMany({ where: { roleId: { in: [roleId, otherRoleId] } } });
  await prisma.stage.deleteMany({ where: { roleId: { in: [roleId, otherRoleId] } } });
  await prisma.role.deleteMany({ where: { id: { in: [roleId, otherRoleId] } } });
});

// ---------------------------------------------------------------------------
// GET /api/applications
// ---------------------------------------------------------------------------
describe('GET /api/applications', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(401);
  });

  it('returns all applications for the company', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((a: { id: number }) => a.id === applicationId);
    expect(found).toBeDefined();
  });

  it('filters by roleId', async () => {
    const res = await request(app)
      .get(`/api/applications?roleId=${roleId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.every((a: { role: { id: number } }) => a.role.id === roleId)).toBe(true);
  });

  it('filters by search (full_name)', async () => {
    const res = await request(app)
      .get('/api/applications?search=Alice')
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    const found = res.body.data.find((a: { id: number }) => a.id === applicationId);
    expect(found).toBeDefined();
  });

  it('returns empty array for search that matches nothing', async () => {
    const res = await request(app)
      .get('/api/applications?search=ZZZ_NoMatch_ZZZ')
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/applications/:id
// ---------------------------------------------------------------------------
describe('GET /api/applications/:id', () => {
  it('returns the application with timeline', async () => {
    const res = await request(app)
      .get(`/api/applications/${applicationId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(applicationId);
    expect(res.body.data.role).toBeDefined();
    expect(Array.isArray(res.body.data.timeline)).toBe(true);
  });

  it('returns 404 for non-existent application', async () => {
    const res = await request(app)
      .get('/api/applications/99999999')
      .set(authHeader(adminToken));
    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get(`/api/applications/${applicationId}`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/applications/:id/stage
// ---------------------------------------------------------------------------
describe('PATCH /api/applications/:id/stage', () => {
  it('moves application to a valid stage', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/stage`)
      .set(authHeader(adminToken))
      .send({ stageId });
    expect(res.status).toBe(200);
    expect(res.body.data.currentStageId).toBe(stageId);
  });

  it('clears the stage when stageId is null', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/stage`)
      .set(authHeader(adminToken))
      .send({ stageId: null });
    expect(res.status).toBe(200);
    expect(res.body.data.currentStageId).toBeNull();
  });

  it('returns 400 when stageId belongs to wrong role', async () => {
    const res = await request(app)
      .patch(`/api/applications/${applicationId}/stage`)
      .set(authHeader(adminToken))
      .send({ stageId: otherStageId });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent application', async () => {
    const res = await request(app)
      .patch('/api/applications/99999999/stage')
      .set(authHeader(adminToken))
      .send({ stageId });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/applications/:id/timeline
// ---------------------------------------------------------------------------
describe('POST /api/applications/:id/timeline', () => {
  it('creates a timeline entry and updates currentStageId', async () => {
    const res = await request(app)
      .post(`/api/applications/${applicationId}/timeline`)
      .set(authHeader(adminToken))
      .send({ stageId, description: 'Moved to phone screen' });
    expect(res.status).toBe(201);
    expect(res.body.data.currentStageId).toBe(stageId);
    expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(1);
    const entry = res.body.data.timeline.find(
      (t: { stageName: string }) => t.stageName !== undefined
    );
    expect(entry).toBeDefined();
  });

  it('creates a timeline entry without a description', async () => {
    const res = await request(app)
      .post(`/api/applications/${applicationId}/timeline`)
      .set(authHeader(adminToken))
      .send({ stageId });
    expect(res.status).toBe(201);
    const entry = res.body.data.timeline[res.body.data.timeline.length - 1];
    // Schema defaults description to "" when omitted
    expect(entry.description ?? '').toBe('');
  });

  it('returns 400 when stageId belongs to wrong role', async () => {
    const res = await request(app)
      .post(`/api/applications/${applicationId}/timeline`)
      .set(authHeader(adminToken))
      .send({ stageId: otherStageId, description: 'Wrong role stage' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when stageId is missing', async () => {
    const res = await request(app)
      .post(`/api/applications/${applicationId}/timeline`)
      .set(authHeader(adminToken))
      .send({ description: 'No stage provided' });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/applications/:id/files/:fieldId
// ---------------------------------------------------------------------------
describe('GET /api/applications/:id/files/:fieldId', () => {
  let appWithResume: number;

  beforeAll(async () => {
    // Manually set a resumeS3Key to simulate an application with a file
    await prisma.application.update({
      where: { id: applicationId },
      data: { resumeS3Key: `companies/1/applications/${applicationId}/resume/cv.pdf` },
    });
    appWithResume = applicationId;
  });

  it('returns a presigned URL for an existing resume', async () => {
    const res = await request(app)
      .get(`/api/applications/${appWithResume}/files/resume`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.url).toBeDefined();
    expect(typeof res.body.data.url).toBe('string');
  });

  it('returns 404 for a field with no file', async () => {
    // Remove resumeS3Key to test the "file not found" case
    await prisma.application.update({
      where: { id: applicationId },
      data: { resumeS3Key: null },
    });
    const res = await request(app)
      .get(`/api/applications/${applicationId}/files/resume`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get(`/api/applications/${applicationId}/files/resume`);
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/applications/export
// ---------------------------------------------------------------------------
describe('GET /api/applications/export', () => {
  it('returns a CSV file with correct headers', async () => {
    const res = await request(app)
      .get('/api/applications/export')
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('id');
    expect(res.text).toContain('role');
    expect(res.text).toContain('full_name');
    expect(res.text).toContain('email');
    expect(res.text).toContain('applied_at');
  });

  it('CSV contains the submitted application row', async () => {
    const res = await request(app)
      .get('/api/applications/export')
      .set(authHeader(adminToken));
    expect(res.text).toContain('Alice Tester');
    expect(res.text).toContain('alice@test.com');
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/applications/export');
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/applications/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/applications/:id', () => {
  let deleteTargetId: number;

  beforeAll(async () => {
    // Submit a fresh application to delete
    const res = await request(app)
      .post(`/api/public/test-co/roles/${roleId}/apply`)
      .field('full_name', 'Bob Delete')
      .field('email', 'bob.delete@test.com');
    deleteTargetId = res.body.data.id;
  });

  it('returns 404 for non-existent application', async () => {
    const res = await request(app)
      .delete('/api/applications/99999999')
      .set(authHeader(adminToken));
    expect(res.status).toBe(404);
  });

  it('deletes an application successfully', async () => {
    const res = await request(app)
      .delete(`/api/applications/${deleteTargetId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app)
      .get(`/api/applications/${deleteTargetId}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete(`/api/applications/${applicationId}`);
    expect(res.status).toBe(401);
  });
});

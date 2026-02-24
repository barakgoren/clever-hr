import { config } from 'dotenv';
config({ path: '.env.test' });

import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function makePrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

async function cleanup(prisma: ReturnType<typeof makePrisma>) {
  const company = await prisma.company.findUnique({ where: { slug: 'test-co' } });
  if (!company) return;
  const cid = company.id;

  const users = await prisma.user.findMany({ where: { companyId: cid }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  if (userIds.length) {
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  }

  const roles = await prisma.role.findMany({ where: { companyId: cid }, select: { id: true } });
  const roleIds = roles.map((r) => r.id);
  if (roleIds.length) {
    await prisma.application.deleteMany({ where: { roleId: { in: roleIds } } });
    await prisma.stage.deleteMany({ where: { roleId: { in: roleIds } } });
  }

  await prisma.role.deleteMany({ where: { companyId: cid } });
  await prisma.user.deleteMany({ where: { companyId: cid } });
  await prisma.company.deleteMany({ where: { id: cid } });
}

export async function setup() {
  const prisma = makePrisma();
  await cleanup(prisma);

  const company = await prisma.company.create({
    data: { name: 'Test Co', slug: 'test-co' },
  });

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Test Admin',
      username: 'testadmin',
      email: 'admin@test-co.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'admin',
    },
  });

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Test User',
      username: 'testuser',
      email: 'user@test-co.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'user',
    },
  });

  await prisma.$disconnect();
}

export async function teardown() {
  const prisma = makePrisma();
  await cleanup(prisma);
  await prisma.$disconnect();
}

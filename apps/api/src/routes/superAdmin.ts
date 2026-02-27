import { Router, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireSuperAdmin, SuperAdminRequest } from "../middleware/superAdminAuth";
import { superAdminService } from "../services/superAdmin.service";
import { superAdminStatsService } from "../services/superAdminStats.service";
import { AppError } from "../middleware/errorHandler";
import { createSuperAdminSchema } from "@repo/shared";
import prisma from "../lib/prisma";

const router = Router();
router.use(requireSuperAdmin);

// GET /api/superadmin/stats
router.get("/stats", async (_req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await superAdminStatsService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// GET /api/superadmin/usage
router.get("/usage", async (_req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const usage = await superAdminStatsService.getEmailUsage();
    res.json({ success: true, data: usage });
  } catch (err) {
    next(err);
  }
});

// GET /api/superadmin/companies
router.get("/companies", async (_req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: companies });
  } catch (err) {
    next(err);
  }
});

// POST /api/superadmin/companies
router.post("/companies", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const { company, user } = req.body as {
      company?: { name?: string; slug?: string; description?: string };
      user?: {
        name?: string;
        username?: string;
        email?: string;
        password?: string;
        role?: string;
      };
    };

    if (!company?.name || !company?.slug || !user?.name || !user?.username || !user?.email || !user?.password) {
      res.status(400).json({
        success: false,
        error: "company.name, company.slug, user.name, user.username, user.email, user.password are required",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(user.password!, 12);

    const { createdCompany, createdUser } = await prisma.$transaction(async (tx) => {
      const existing = await tx.company.findUnique({
        where: { slug: company.slug! },
      });
      if (existing) throw new AppError(409, "Slug already taken");

      const createdCompany = await tx.company.create({
        data: {
          name: company.name!,
          slug: company.slug!,
          description: company.description,
        },
      });

      const createdUser = await tx.user.create({
        data: {
          companyId: createdCompany.id,
          name: user.name!,
          username: user.username!,
          email: user.email!,
          passwordHash,
          role: user.role === "user" ? "user" : "admin",
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          companyId: true,
          createdAt: true,
        },
      });
      return { createdCompany, createdUser };
    });

    res.status(201).json({
      success: true,
      data: { company: createdCompany, user: createdUser },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/superadmin/companies/:id
router.get("/companies/:id", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
    if (!company) {
      res.status(404).json({ success: false, error: "Company not found" });
      return;
    }
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/superadmin/companies/:id
router.delete("/companies/:id", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.company.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/superadmin/companies/:id
router.patch("/companies/:id", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const { name, slug, description } = z
      .object({
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
      })
      .parse(req.body);
    const company = await prisma.company.update({
      where: { id },
      data: { name, slug, description },
    });
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/superadmin/companies/:id/plan
router.patch("/companies/:id/plan", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const { plan } = z.object({ plan: z.enum(["team", "ultimate"]) }).parse(req.body);
    const company = await prisma.company.update({
      where: { id },
      data: { plan },
      select: { id: true, name: true, slug: true, plan: true },
    });
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
});

// GET /api/superadmin/companies/:id/users
router.get("/companies/:id/users", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = parseInt(req.params.id);
    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// POST /api/superadmin/companies/:id/users
router.post("/companies/:id/users", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = parseInt(req.params.id);
    const { name, username, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        companyId,
        name,
        username,
        email,
        passwordHash,
        role: role ?? "user",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/superadmin/companies/:id/users/:userId
router.delete("/companies/:id/users/:userId", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
    });
    if (!user) {
      res.status(404).json({ success: false, error: "User not found in this company" });
      return;
    }
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/superadmin/admins
router.get("/admins", async (_req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const admins = await superAdminService.list();
    res.json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
});

// POST /api/superadmin/admins
router.post("/admins", async (req: SuperAdminRequest, res: Response, next: NextFunction) => {
  try {
    const body = createSuperAdminSchema.parse(req.body);
    const sa = await superAdminService.create(body.username, body.name, body.password);
    res.status(201).json({ success: true, data: sa });
  } catch (err) {
    next(err);
  }
});

export default router;

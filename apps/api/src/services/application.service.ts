import { stringify } from 'csv-stringify/sync';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { s3Service } from './s3.service';

export const applicationService = {
  async list(companyId: number, filters: { roleId?: number; search?: string }) {
    return prisma.application.findMany({
      where: {
        companyId,
        ...(filters.roleId ? { roleId: filters.roleId } : {}),
        ...(filters.search
          ? {
              formData: {
                path: ['full_name'],
                string_contains: filters.search,
              },
            }
          : {}),
      },
      include: {
        role: { select: { id: true, name: true } },
        currentStage: { select: { id: true, name: true, color: true, icon: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: number, companyId: number) {
    const app = await prisma.application.findFirst({
      where: { id, companyId },
      include: {
        role: { select: { id: true, name: true, customFields: true } },
        currentStage: { select: { id: true, name: true, color: true, icon: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!app) throw new AppError(404, 'Application not found');
    return app;
  },

  async submit(
    roleId: number,
    companyId: number,
    formData: Record<string, string | boolean>,
    file?: { buffer: Buffer; originalname: string; mimetype: string }
  ) {
    // Create application first to get ID
    const application = await prisma.application.create({
      data: { roleId, companyId, formData },
    });

    // Upload resume if provided
    if (file) {
      const key = s3Service.keys.applicationFile(
        companyId,
        application.id,
        'resume',
        file.originalname
      );
      await s3Service.upload(key, file.buffer, file.mimetype);
      await prisma.application.update({ where: { id: application.id }, data: { resumeS3Key: key } });
    }

    return application;
  },

  async moveStage(id: number, companyId: number, stageId: number | null) {
    await this.getById(id, companyId);

    if (stageId !== null) {
      const app = await prisma.application.findUnique({ where: { id } });
      const stage = await prisma.stage.findFirst({ where: { id: stageId, roleId: app!.roleId } });
      if (!stage) throw new AppError(400, 'Stage does not belong to this application\'s role');
    }

    return prisma.application.update({ where: { id }, data: { currentStageId: stageId } });
  },

  async addTimelineEntry(
    id: number,
    companyId: number,
    data: { stageId: number; description?: string }
  ) {
    const app = await this.getById(id, companyId);

    const stage = await prisma.stage.findFirst({ where: { id: data.stageId, roleId: app.roleId } });
    if (!stage) throw new AppError(400, 'Stage does not belong to this application\'s role');

    await prisma.$transaction(async (tx) => {
      await tx.applicationTimeline.create({
        data: {
          applicationId: id,
          companyId,
          stageId: stage.id,
          stageName: stage.name,
          description: data.description ?? null,
        },
      });

      await tx.application.update({ where: { id }, data: { currentStageId: stage.id } });
    });

    return this.getById(id, companyId);
  },

  async delete(id: number, companyId: number) {
    const app = await this.getById(id, companyId);
    if (app.resumeS3Key) {
      await s3Service.delete(app.resumeS3Key).catch(() => {}); // best-effort
    }
    await prisma.application.delete({ where: { id } });
  },

  async getFilePresignedUrl(id: number, companyId: number, fieldId: string) {
    const app = await this.getById(id, companyId);
    const key = fieldId === 'resume' ? app.resumeS3Key : null;
    if (!key) throw new AppError(404, 'File not found');
    return s3Service.getPresignedUrl(key);
  },

  async exportCsv(companyId: number): Promise<string> {
    const applications = await this.list(companyId, {});
    if (applications.length === 0) return 'id,role,full_name,email,applied_at\n';

    type AppRow = (typeof applications)[number];
    const rows = applications.map((app: AppRow) => {
      const fd = app.formData as Record<string, string>;
      return {
        id: app.id,
        role: app.role.name,
        full_name: fd.full_name ?? '',
        email: fd.email ?? '',
        applied_at: app.createdAt.toISOString(),
      };
    });

    return stringify(rows, { header: true });
  },
};

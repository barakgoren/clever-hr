-- AlterTable
ALTER TABLE "Application" ADD COLUMN "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Application_roleId_email_key" ON "Application"("roleId", "email");

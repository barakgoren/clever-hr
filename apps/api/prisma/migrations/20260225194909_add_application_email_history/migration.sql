-- CreateTable
CREATE TABLE "ApplicationEmail" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "senderUserId" INTEGER NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "templateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationEmail_applicationId_createdAt_idx" ON "ApplicationEmail"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEmail_companyId_idx" ON "ApplicationEmail"("companyId");

-- AddForeignKey
ALTER TABLE "ApplicationEmail" ADD CONSTRAINT "ApplicationEmail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEmail" ADD CONSTRAINT "ApplicationEmail_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEmail" ADD CONSTRAINT "ApplicationEmail_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

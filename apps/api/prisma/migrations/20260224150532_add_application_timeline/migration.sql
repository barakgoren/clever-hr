-- CreateTable
CREATE TABLE "ApplicationTimeline" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "stageId" INTEGER,
    "stageName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationTimeline_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApplicationTimeline" ADD CONSTRAINT "ApplicationTimeline_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTimeline" ADD CONSTRAINT "ApplicationTimeline_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTimeline" ADD CONSTRAINT "ApplicationTimeline_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "ApplicationEmail" DROP CONSTRAINT "ApplicationEmail_senderUserId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_createdByUserId_fkey";

-- AlterTable
ALTER TABLE "ApplicationEmail" ALTER COLUMN "senderUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "createdByUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEmail" ADD CONSTRAINT "ApplicationEmail_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

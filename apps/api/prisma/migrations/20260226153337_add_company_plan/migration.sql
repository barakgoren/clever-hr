-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('team', 'ultimate');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'team';

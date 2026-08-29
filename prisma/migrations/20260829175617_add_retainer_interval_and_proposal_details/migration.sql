-- CreateEnum
CREATE TYPE "RetainerInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "retainerInterval" "RetainerInterval" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "clientProvides" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "validUntil" TIMESTAMP(3);

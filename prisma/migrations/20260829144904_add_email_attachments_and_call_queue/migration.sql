-- CreateEnum
CREATE TYPE "CallQueueStatus" AS ENUM ('ACTIVE', 'COMPLETE');

-- CreateTable
CREATE TABLE "EmailAttachment" (
    "id" TEXT NOT NULL,
    "emailLogId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallQueueLead" (
    "id" TEXT NOT NULL,
    "leadName" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "sequenceDay" INTEGER NOT NULL DEFAULT 1,
    "nextCallDate" TIMESTAMP(3) NOT NULL,
    "status" "CallQueueStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallQueueLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailAttachment_emailLogId_idx" ON "EmailAttachment"("emailLogId");

-- CreateIndex
CREATE INDEX "CallQueueLead_status_nextCallDate_idx" ON "CallQueueLead"("status", "nextCallDate");

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailLogId_fkey" FOREIGN KEY ("emailLogId") REFERENCES "EmailLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ProjectFileKind" AS ENUM ('DELIVERABLE', 'MEDIA');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "ProjectFile" ADD COLUMN     "kind" "ProjectFileKind" NOT NULL DEFAULT 'DELIVERABLE',
ADD COLUMN     "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "uploadedBy" TEXT NOT NULL DEFAULT 'admin';

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;


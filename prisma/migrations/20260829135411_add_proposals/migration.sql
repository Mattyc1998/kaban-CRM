-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'DECLINED');

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "clientName" TEXT,
    "clientCompany" TEXT,
    "clientEmail" TEXT,
    "scope" TEXT NOT NULL,
    "price" INTEGER,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "publicSlug" TEXT NOT NULL,
    "signedName" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_publicSlug_key" ON "Proposal"("publicSlug");

-- CreateIndex
CREATE INDEX "Proposal_contactId_idx" ON "Proposal"("contactId");

-- CreateIndex
CREATE INDEX "Proposal_projectId_idx" ON "Proposal"("projectId");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

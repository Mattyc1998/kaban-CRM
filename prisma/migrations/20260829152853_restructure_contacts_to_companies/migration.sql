-- Hand-written data-preserving migration: splits the flat "Contact" model
-- (which conflated a business and one person at it) into "Company" (the
-- paying business — holds projects/leads/proposals/retainer/email log) and
-- a new person-level "Contact" (multiple people per company).
--
-- Trick: Company reuses the same `id` values as the old Contact rows, so
-- every FK column that pointed at Contact (Project/Lead/Proposal/EmailLog
-- .contactId) can just be renamed to .companyId with zero value changes —
-- no remapping table needed.

-- 1. Create Company
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- 2. Backfill Company from old Contact rows (same id)
INSERT INTO "Company" ("id", "name", "notes", "createdAt", "updatedAt")
SELECT "id", COALESCE(NULLIF("company", ''), "name"), "notes", "createdAt", "updatedAt"
FROM "Contact";

-- 3. Drop old FKs pointing at Contact so it can be safely dropped/replaced
ALTER TABLE "Project" DROP CONSTRAINT "Project_contactId_fkey";
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_contactId_fkey";
ALTER TABLE "Proposal" DROP CONSTRAINT "Proposal_contactId_fkey";
ALTER TABLE "EmailLog" DROP CONSTRAINT "EmailLog_contactId_fkey";

-- 4. Drop old indexes on those columns (recreated under new names below)
DROP INDEX "Project_contactId_idx";
DROP INDEX "Lead_contactId_idx";
DROP INDEX "Proposal_contactId_idx";
DROP INDEX "EmailLog_contactId_idx";

-- 5. Rename FK columns — values unchanged, since Company reused Contact's ids
ALTER TABLE "Project" RENAME COLUMN "contactId" TO "companyId";
ALTER TABLE "Lead" RENAME COLUMN "contactId" TO "companyId";
ALTER TABLE "Proposal" RENAME COLUMN "contactId" TO "companyId";
ALTER TABLE "EmailLog" RENAME COLUMN "contactId" TO "companyId";

-- 6. Stage the old Contact rows (person-level data) before repurposing the table name
CREATE TABLE "_OldContact" AS SELECT * FROM "Contact";

-- 7. Drop the old Contact table (its data now lives in Company + the staging table)
DROP TABLE "Contact";

-- 8. Create the new person-level Contact table
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- 9. Backfill one Contact (person) row per old Contact row, under its new Company
INSERT INTO "Contact" ("id", "companyId", "name", "email", "phone", "createdAt", "updatedAt")
SELECT "id" || '-person', "id", "name", "email", "phone", "createdAt", "updatedAt"
FROM "_OldContact";

-- 10. Clean up the staging table
DROP TABLE "_OldContact";

-- 11. Indexes
CREATE INDEX "Company_name_idx" ON "Company"("name");
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");
CREATE INDEX "Contact_email_idx" ON "Contact"("email");
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX "Lead_companyId_idx" ON "Lead"("companyId");
CREATE INDEX "Proposal_companyId_idx" ON "Proposal"("companyId");
CREATE INDEX "EmailLog_companyId_idx" ON "EmailLog"("companyId");

-- 12. FK constraints
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

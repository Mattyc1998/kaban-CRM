-- AlterEnum
BEGIN;
CREATE TYPE "LeadStage_new" AS ENUM ('INTERESTED', 'RESEARCH', 'READY_TO_CALL', 'CALL_BOOKED', 'WON', 'LOST');
ALTER TABLE "public"."Lead" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "Lead" ALTER COLUMN "stage" TYPE "LeadStage_new" USING ("stage"::text::"LeadStage_new");
ALTER TYPE "LeadStage" RENAME TO "LeadStage_old";
ALTER TYPE "LeadStage_new" RENAME TO "LeadStage";
DROP TYPE "public"."LeadStage_old";
ALTER TABLE "Lead" ALTER COLUMN "stage" SET DEFAULT 'INTERESTED';
COMMIT;

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "stage" SET DEFAULT 'INTERESTED';


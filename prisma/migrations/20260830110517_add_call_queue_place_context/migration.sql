-- AlterTable
ALTER TABLE "CallQueueLead" ADD COLUMN     "address" TEXT,
ADD COLUMN     "placeId" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "reviews" INTEGER,
ADD COLUMN     "website" TEXT;

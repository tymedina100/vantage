-- AlterTable: add day column; existing rows are backfilled from sentAt below
ALTER TABLE "Nudge" ADD COLUMN     "day" DATE NOT NULL DEFAULT CURRENT_DATE;

-- Backfill day from sentAt for existing rows
UPDATE "Nudge" SET "day" = "sentAt"::date;

-- Remove duplicate nudges sharing (userId, type, day), keeping the most recent
DELETE FROM "Nudge" a USING "Nudge" b
WHERE a."userId" = b."userId"
  AND a."type" = b."type"
  AND a."day" = b."day"
  AND (a."sentAt" < b."sentAt" OR (a."sentAt" = b."sentAt" AND a."id" < b."id"));

-- AlterTable
ALTER TABLE "PlaidItem" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "Nudge_userId_type_day_key" ON "Nudge"("userId", "type", "day");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

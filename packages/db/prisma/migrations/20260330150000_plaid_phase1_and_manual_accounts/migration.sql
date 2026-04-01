-- Add account source metadata and Plaid item lifecycle fields.
CREATE TYPE "AccountSource" AS ENUM ('PLAID', 'MANUAL');
CREATE TYPE "PlaidItemStatus" AS ENUM ('HEALTHY', 'NEEDS_RELINK', 'ERROR', 'PENDING_EXPIRATION');

ALTER TABLE "Account"
ADD COLUMN "source" "AccountSource" NOT NULL DEFAULT 'MANUAL';

UPDATE "Account"
SET "source" = 'PLAID'
WHERE "plaidAccountId" IS NOT NULL;

ALTER TABLE "PlaidItem"
RENAME COLUMN "accessToken" TO "accessTokenEncrypted";

ALTER TABLE "PlaidItem"
ADD COLUMN "status" "PlaidItemStatus" NOT NULL DEFAULT 'HEALTHY',
ADD COLUMN "needsRelink" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "errorCode" TEXT,
ADD COLUMN "errorMessage" TEXT,
ADD COLUMN "syncCursor" TEXT,
ADD COLUMN "lastSyncAt" TIMESTAMP(3),
ADD COLUMN "lastWebhookAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "PlaidItem_userId_status_idx" ON "PlaidItem"("userId", "status");

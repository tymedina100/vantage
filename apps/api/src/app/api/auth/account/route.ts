import { NextRequest } from "next/server";
import { prisma } from "@worthlane/db";
import { getAuthUser } from "@/lib/auth";
import { decryptPlaidAccessToken, removeItem } from "@/lib/plaid";
import { ok, unauthorized } from "@/lib/response";
import { captureServerException } from "@/lib/sentry";

// Permanent account deletion (required by App Store guideline 5.1.1(v)).
// Removes the user and, via cascade, all accounts, transactions, budgets,
// goals, streaks, nudges, snapshots, and recurring items.
export async function DELETE(req: NextRequest) {
  let userId: string;
  try {
    ({ sub: userId } = getAuthUser(req));
  } catch {
    return unauthorized();
  }

  // Best effort: revoke Plaid access tokens so the bank connections are
  // actually severed, not just forgotten.
  const plaidItems = await prisma.plaidItem.findMany({ where: { userId } });
  for (const item of plaidItems) {
    try {
      await removeItem(decryptPlaidAccessToken(item.accessTokenEncrypted));
    } catch (error) {
      captureServerException(error, {
        tags: { route: "/api/auth/account" },
        extra: { userId, plaidItemId: item.id },
      });
    }
  }

  await prisma.$transaction([
    // Budgets reference categories with RESTRICT; remove them first so the
    // user's custom categories can cascade cleanly.
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.plaidItem.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return ok({ deleted: true });
}

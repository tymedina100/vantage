import { NextRequest } from "next/server";
import { prisma } from "@worthlane/db";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/response";

const MONTHLY_FACTOR: Record<string, number> = {
  WEEKLY: 52 / 12,
  BIWEEKLY: 26 / 12,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12,
};

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    ({ sub: userId } = getAuthUser(req));
  } catch {
    return unauthorized();
  }

  const rows = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true, isMuted: false },
    orderBy: { nextDueDate: "asc" },
  });

  const items = rows.map((r) => ({
    id: r.id,
    displayName: r.displayName,
    categoryId: r.categoryId,
    accountId: r.accountId,
    averageAmount: r.averageAmount.toNumber(),
    frequency: r.frequency,
    lastSeenDate: r.lastSeenDate.toISOString().split("T")[0],
    nextDueDate: r.nextDueDate.toISOString().split("T")[0],
    occurrenceCount: r.occurrenceCount,
    isMuted: r.isMuted,
  }));

  const monthlyTotal = items.reduce(
    (sum, item) => sum + item.averageAmount * (MONTHLY_FACTOR[item.frequency] ?? 1),
    0
  );

  return ok({ items, monthlyTotal: Math.round(monthlyTotal * 100) / 100 });
}

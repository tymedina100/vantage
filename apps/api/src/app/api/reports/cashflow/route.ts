import { NextRequest } from "next/server";
import { prisma } from "@worthlane/db";
import { getAuthUser } from "@/lib/auth";
import { startOfMonth } from "@/lib/dates";
import { ok, unauthorized } from "@/lib/response";

// Per-calendar-month income vs. spending. Sign convention: positive
// amounts are expenses, negative are income (Plaid convention).
export async function GET(req: NextRequest) {
  let userId: string;
  try {
    ({ sub: userId } = getAuthUser(req));
  } catch {
    return unauthorized();
  }

  const monthsParam = Number(req.nextUrl.searchParams.get("months") ?? 6);
  const months = Number.isInteger(monthsParam) && monthsParam >= 1 && monthsParam <= 24 ? monthsParam : 6;

  const now = new Date();
  const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lte: now } },
    select: { amount: true, date: true },
  });

  // Seed every month in the window so quiet months still chart as zero.
  const buckets = new Map<string, { income: number; spending: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { income: 0, spending: 0 });
  }

  for (const tx of transactions) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const amount = tx.amount.toNumber();
    if (amount < 0) bucket.income += Math.abs(amount);
    else bucket.spending += amount;
  }

  const monthsResult = [...buckets.entries()].map(([month, b]) => ({
    month,
    income: Math.round(b.income * 100) / 100,
    spending: Math.round(b.spending * 100) / 100,
    net: Math.round((b.income - b.spending) * 100) / 100,
  }));

  return ok({ months: monthsResult });
}

import { prisma } from "@worthlane/db";

interface BalanceLike {
  type: string;
  currentBalance: { toNumber(): number };
}

/** Assets add, debts (credit/loans) subtract. */
export function computeNetWorth(accounts: BalanceLike[]): number {
  return accounts.reduce((sum, a) => {
    const bal = a.currentBalance.toNumber();
    return sum + (a.type === "CREDIT" || a.type === "LOAN" ? -bal : bal);
  }, 0);
}

export function computeBreakdown(accounts: BalanceLike[]): { assets: number; liabilities: number } {
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    const bal = a.currentBalance.toNumber();
    if (a.type === "CREDIT" || a.type === "LOAN") liabilities += bal;
    else assets += bal;
  }
  return { assets, liabilities };
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Computes the user's current net worth and upserts today's snapshot. */
export async function snapshotUserNetWorth(userId: string): Promise<number> {
  const accounts = await prisma.account.findMany({ where: { userId } });
  const netWorth = computeNetWorth(accounts);
  const today = startOfToday();

  await prisma.netWorthSnapshot.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, netWorth },
    update: { netWorth },
  });

  return netWorth;
}

import { z } from "zod";

// Money columns are Decimal(12, 2): 10 integer digits, 2 decimal places.
// Reject anything that would silently truncate or overflow.
const MAX_MONEY = 9_999_999_999.99;

function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

/** Signed amount (transactions: positive = expense, negative = income). */
export const moneyAmount = z
  .number()
  .finite()
  .refine((v) => Math.abs(v) <= MAX_MONEY, "Amount is too large")
  .refine(hasAtMostTwoDecimals, "Amount can have at most 2 decimal places");

/** Strictly positive amount (budgets, goals, contributions, balances). */
export const positiveMoneyAmount = moneyAmount.refine((v) => v > 0, "Amount must be greater than zero");

/** Non-negative amount (account balances may be zero). */
export const nonNegativeMoneyAmount = moneyAmount.refine((v) => v >= 0, "Amount cannot be negative");

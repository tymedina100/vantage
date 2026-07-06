import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { detectRecurringForUser } from "@/lib/recurring";
import { ok, unauthorized } from "@/lib/response";

// Manual re-scan trigger (also runs after Plaid syncs and on the daily cron).
export async function POST(req: NextRequest) {
  let userId: string;
  try {
    ({ sub: userId } = getAuthUser(req));
  } catch {
    return unauthorized();
  }

  const limited = checkRateLimit(`recurring-detect:${userId}`, 5, 60 * 60 * 1000);
  if (limited) return limited;

  await detectRecurringForUser(userId);
  return ok({ detected: true });
}

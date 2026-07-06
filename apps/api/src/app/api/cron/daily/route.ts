import { NextRequest } from "next/server";
import { prisma } from "@worthlane/db";
import { snapshotUserNetWorth } from "@/lib/net-worth";
import { detectRecurringForUser } from "@/lib/recurring";
import { ok, err } from "@/lib/response";
import { captureServerException } from "@/lib/sentry";

// Daily maintenance cron: snapshots every user's net worth (so the history
// chart has no gaps) and refreshes recurring-transaction detection.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return err("Unauthorized", 401);
  }

  const users = await prisma.user.findMany({ select: { id: true } });

  let snapshots = 0;
  let recurring = 0;
  let failed = 0;
  for (const user of users) {
    try {
      await snapshotUserNetWorth(user.id);
      snapshots++;
    } catch (error) {
      captureServerException(error, {
        tags: { route: "/api/cron/daily", step: "snapshot" },
        extra: { userId: user.id },
      });
      failed++;
    }

    try {
      await detectRecurringForUser(user.id);
      recurring++;
    } catch (error) {
      captureServerException(error, {
        tags: { route: "/api/cron/daily", step: "recurring" },
        extra: { userId: user.id },
      });
      failed++;
    }
  }

  return ok({ snapshots, recurring, failed });
}

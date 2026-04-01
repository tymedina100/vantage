import { NextRequest } from "next/server";
import { prisma } from "@worthlane/db";
import { generateNudgesForUser } from "@/lib/nudge-engine";
import { ok, err } from "@/lib/response";
import { captureServerException } from "@/lib/sentry";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return err("Unauthorized", 401);
  }

  const users = await prisma.user.findMany({
    where: { pushToken: { not: null } },
    select: { id: true },
  });

  let processed = 0;
  let failed = 0;
  for (const user of users) {
    try {
      await generateNudgesForUser(user.id);
      processed++;
    } catch (error) {
      captureServerException(error, {
        tags: { route: "/api/cron/nudges" },
        extra: { userId: user.id },
      });

      failed++;
    }
  }

  return ok({ processed, failed });
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { PlaidIntegrationError } from "@/lib/plaid";
import { syncPlaidItemsForUser } from "@/lib/plaid-sync";
import { err, ok, unauthorized } from "@/lib/response";
import { captureServerException } from "@/lib/sentry";

const schema = z.object({
  plaidItemId: z.string().optional(),
  refresh: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    ({ sub: userId } = getAuthUser(req));
  } catch {
    return unauthorized();
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid request body");

  try {
    const result = await syncPlaidItemsForUser(userId, {
      plaidItemId: parsed.data.plaidItemId,
      refresh: parsed.data.refresh ?? true,
    });

    return ok(result);
  } catch (error) {
    if (error instanceof PlaidIntegrationError) {
      return err(error.message, error.status, error.code);
    }

    captureServerException(error, {
      tags: { route: "/api/plaid/sync" },
      extra: {
        plaidItemId: parsed.data.plaidItemId ?? null,
        refresh: parsed.data.refresh ?? true,
        userId,
      },
    });

    return err(error instanceof Error ? error.message : "Could not sync Plaid items.", 500);
  }
}

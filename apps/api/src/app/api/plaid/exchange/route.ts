import { NextRequest } from "next/server";
import { z } from "zod";
import { PlaidItemStatus, prisma } from "@worthlane/db";
import { getAuthUser } from "@/lib/auth";
import {
  encryptPlaidAccessToken,
  exchangePublicToken,
  PlaidIntegrationError,
} from "@/lib/plaid";
import { captureServerEvent } from "@/lib/posthog";
import { syncPlaidItemRecord } from "@/lib/plaid-sync";
import { ok, err, unauthorized } from "@/lib/response";
import { captureServerException } from "@/lib/sentry";

const schema = z.object({
  publicToken: z.string(),
  institutionName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    ({ sub: userId } = getAuthUser(req));
  } catch {
    return unauthorized();
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid request body");

  const { publicToken, institutionName } = parsed.data;

  try {
    const { accessToken, itemId } = await exchangePublicToken(publicToken);
    const existing = await prisma.plaidItem.findUnique({ where: { itemId } });
    if (existing && existing.userId !== userId) {
      return err("This institution is already linked to another account.", 409, "PLAID_ITEM_ALREADY_LINKED");
    }

    const created = !existing;
    const plaidItem = await prisma.plaidItem.upsert({
      where: { itemId },
      create: {
        userId,
        itemId,
        institution: institutionName,
        accessTokenEncrypted: encryptPlaidAccessToken(accessToken),
        status: PlaidItemStatus.HEALTHY,
      },
      update: {
        institution: institutionName ?? existing?.institution ?? null,
        accessTokenEncrypted: encryptPlaidAccessToken(accessToken),
        status: PlaidItemStatus.HEALTHY,
        needsRelink: false,
        errorCode: null,
        errorMessage: null,
      },
    });

    const syncResult = await syncPlaidItemRecord(plaidItem, { refresh: true });

    await captureServerEvent({
      distinctId: userId,
      event: "bank account linked",
      properties: {
        institution: plaidItem.institution ?? institutionName ?? null,
        plaidItemId: plaidItem.id,
        itemId,
        mode: created ? "create" : "update",
      },
    });

    return ok({
      plaidItem: {
        id: plaidItem.id,
        institution: plaidItem.institution ?? institutionName ?? null,
      },
      sync: syncResult,
    }, created ? 201 : 200);
  } catch (error) {
    if (error instanceof PlaidIntegrationError) {
      return err(error.message, error.status, error.code);
    }

    captureServerException(error, {
      tags: { route: "/api/plaid/exchange" },
      extra: {
        institutionName: institutionName ?? null,
        userId,
      },
    });

    return err(error instanceof Error ? error.message : "Could not exchange the Plaid public token.", 500);
  }
}

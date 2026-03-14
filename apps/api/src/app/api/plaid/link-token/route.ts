import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createLinkToken } from "@/lib/plaid";
import { ok, err, unauthorized } from "@/lib/response";

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    ({ sub: userId } = getAuthUser(req));
  } catch {
    return unauthorized();
  }

  try {
    const linkToken = await createLinkToken(userId);
    return ok({ linkToken });
  } catch (e: any) {
    console.error("Plaid link-token error:", e?.response?.data ?? e?.message ?? e);
    return err("Failed to create link token");
  }
}

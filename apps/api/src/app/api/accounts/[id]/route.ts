import { NextRequest } from "next/server";
import { prisma } from "@finance/db";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, notFound } from "@/lib/response";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  let userId: string;
  try {
    ({ sub: userId } = getAuthUser(req));
  } catch {
    return unauthorized();
  }

  const account = await prisma.account.findFirst({ where: { id: params.id, userId } });
  if (!account) return notFound("Account not found");

  if (account.plaidItemId) {
    // Account.plaidItemId has no Prisma relation/cascade, so we must manually
    // delete all accounts under this Plaid item first (transactions cascade from accounts)
    const plaidItemId = account.plaidItemId;
    await prisma.account.deleteMany({ where: { plaidItemId, userId } });
    await prisma.plaidItem.delete({ where: { itemId: plaidItemId } });
  } else {
    await prisma.account.delete({ where: { id: params.id } });
  }

  return ok({ deleted: true });
}

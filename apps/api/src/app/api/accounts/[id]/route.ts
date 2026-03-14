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

  // Delete the PlaidItem (cascades to accounts and their transactions via DB constraints)
  // If no plaidItemId, just delete the account directly
  if (account.plaidItemId) {
    await prisma.plaidItem.delete({ where: { itemId: account.plaidItemId } });
  } else {
    await prisma.account.delete({ where: { id: params.id } });
  }

  return ok({ deleted: true });
}

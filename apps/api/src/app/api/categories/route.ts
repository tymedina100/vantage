import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/response";
import { getSystemCategories } from "@/lib/categories";

export async function GET(req: NextRequest) {
  try {
    getAuthUser(req);
  } catch {
    return unauthorized();
  }

  const categories = await getSystemCategories();
  return ok(categories);
}

import { NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@worthlane/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";
import { ok, err } from "@/lib/response";
import { captureServerException } from "@/lib/sentry";

const schema = z.object({
  email: z.string().email(),
});

// 8 chars from an unambiguous alphabet (no 0/O/1/I) — short enough to type
// from an email, and brute force is covered by the rate limits below plus
// 1-hour expiry and single use.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateResetCode(): string {
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}

const GENERIC_RESPONSE = { message: "If that email exists, a reset code has been sent." };

export async function POST(req: NextRequest) {
  const ipLimited = checkRateLimit(ipKey(req, "forgot-password"), 10, 60 * 60 * 1000);
  if (ipLimited) return ipLimited;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err("Invalid request body");

  const email = parsed.data.email.toLowerCase().trim();

  const emailLimited = checkRateLimit(`forgot-password:${email}`, 3, 60 * 60 * 1000);
  if (emailLimited) return emailLimited;

  // Always return success to avoid revealing whether an email is registered.
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return ok(GENERIC_RESPONSE);
  }

  // Invalidate any existing unused tokens for this user.
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: code, expiresAt },
  });

  try {
    await sendPasswordResetEmail(email, code);
  } catch (error) {
    captureServerException(error, { tags: { route: "/api/auth/forgot-password" } });
    // Still return the generic response — the user can retry.
  }

  return ok(GENERIC_RESPONSE);
}

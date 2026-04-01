import * as Sentry from "@sentry/nextjs";

type CaptureContext = Parameters<typeof Sentry.captureException>[1];

export function captureServerException(error: unknown, context?: CaptureContext) {
  const normalizedError =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unexpected server error");

  Sentry.captureException(normalizedError, context);
}

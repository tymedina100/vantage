import { PostHog } from "posthog-node";

type EventProperties = Record<string, unknown>;

let client: PostHog | null | undefined;

function getClient() {
  if (client !== undefined) return client;

  const apiKey = process.env.POSTHOG_PROJECT_KEY?.trim();
  if (!apiKey) {
    client = null;
    return client;
  }

  client = new PostHog(apiKey, {
    host: process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

  return client;
}

export async function captureServerEvent({
  distinctId,
  event,
  properties,
}: {
  distinctId: string;
  event: string;
  properties?: EventProperties;
}) {
  const posthog = getClient();
  if (!posthog) return;

  try {
    await posthog.captureImmediate({
      distinctId,
      event,
      properties,
    });
  } catch (error) {
    console.error("PostHog capture failed", error);
  }
}

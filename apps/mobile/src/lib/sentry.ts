import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

type SentryExtra = {
  dsn?: string | null;
  environment?: string | null;
};

const isDevelopment = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";
const sentryExtra = (Constants.expoConfig?.extra?.sentry ?? null) as SentryExtra | null;
const dsn = sentryExtra?.dsn?.trim() || process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const environment =
  sentryExtra?.environment?.trim() ||
  process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT?.trim() ||
  (isDevelopment ? "development" : "production");

const sentryGlobal = globalThis as typeof globalThis & {
  __WORTHLANE_SENTRY_INITIALIZED__?: boolean;
};

// Only initialize the native Sentry SDK when a DSN is configured. Calling
// Sentry.init unconditionally spins up native work at launch that isn't needed
// when Sentry is unconfigured (as in the current production build). Sentry.wrap
// below still works without init.
if (dsn && !sentryGlobal.__WORTHLANE_SENTRY_INITIALIZED__) {
  Sentry.init({
    dsn,
    enabled: true,
    environment,
    sendDefaultPii: true,
    tracesSampleRate: isDevelopment ? 1.0 : 0.2,
  });

  sentryGlobal.__WORTHLANE_SENTRY_INITIALIZED__ = true;
}

export { Sentry };

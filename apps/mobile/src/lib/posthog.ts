import PostHog from "posthog-react-native";

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim() ?? "";
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

export const posthog = new PostHog(posthogKey || "disabled", {
  host: posthogHost,
  disabled: !posthogKey,
  captureAppLifecycleEvents: true,
  disableGeoip: false,
});

export const isPostHogEnabled = Boolean(posthogKey);

import { useEffect } from "react";
import { Stack, usePathname } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Sentry } from "@/lib/sentry";
import { isPostHogEnabled, posthog } from "@/lib/posthog";
import { useAuthStore } from "@/store/auth";
import { colors } from "@/lib/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AnalyticsScreenTracker />
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AnalyticsScreenTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isPostHogEnabled || !pathname) return;
    posthog.screen(pathname);
  }, [pathname]);

  return null;
}

export default Sentry.wrap(RootLayout);

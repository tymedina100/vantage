import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { spacing, radius } from "@/lib/theme";
import { useThemedStyles, type Theme } from "@/lib/ThemeContext";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

// Hooks can't live in the class, so the themed UI is a functional child.
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error?.message ?? "An unexpected error occurred."}</Text>
      <TouchableOpacity style={styles.button} onPress={onReset} accessibilityRole="button">
        <Text style={styles.buttonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    return <ErrorFallback error={this.state.error} onReset={this.reset} />;
  }
}

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    emoji: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h2,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    message: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.sm,
    },
    buttonText: {
      ...typography.body,
      color: colors.onPrimary,
      fontWeight: "700",
    },
  });

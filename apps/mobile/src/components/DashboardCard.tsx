import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radius, typography } from "@/lib/theme";

interface DashboardCardProps {
  title?: string;
  accent?: string;
  children: React.ReactNode;
}

export function DashboardCard({ title, accent, children }: DashboardCardProps) {
  return (
    <View style={[styles.card, accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : null]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 11,
  },
});

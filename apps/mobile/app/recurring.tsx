import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/finance";
import { spacing, radius } from "@/lib/theme";
import { useTheme, useThemedStyles, type Theme } from "@/lib/ThemeContext";
import { EmptyState } from "@/components/EmptyState";
import type { RecurringItem, RecurringResponse } from "@worthlane/types";

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

function daysUntil(dateStr: string): number {
  const due = new Date(`${dateStr}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}

function dueLabel(dateStr: string): { text: string; overdue: boolean } {
  const days = daysUntil(dateStr);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  if (days === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `Due in ${days}d`, overdue: false };
}

function RecurringRow({ item, onMute }: { item: RecurringItem; onMute: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const due = dueLabel(item.nextDueDate);

  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.displayName}
        </Text>
        <Text style={styles.rowMeta}>
          {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
          {"  ·  "}
          <Text style={{ color: due.overdue ? colors.warning : colors.textMuted }}>{due.text}</Text>
        </Text>
      </View>
      <Text style={styles.rowAmount}>{formatCurrency(item.averageAmount)}</Text>
      <TouchableOpacity
        onPress={onMute}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Mute ${item.displayName}`}
      >
        <Ionicons name="eye-off-outline" size={18} color={colors.textDim} />
      </TouchableOpacity>
    </View>
  );
}

export default function RecurringScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const qc = useQueryClient();

  const recurringQuery = useQuery({
    queryKey: ["recurring"],
    queryFn: () => api.get<RecurringResponse>("/recurring"),
  });

  const muteMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/recurring/${id}`, { isMuted: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
    onError: () => Alert.alert("Could not mute", "Please try again."),
  });

  const rescanMutation = useMutation({
    mutationFn: () => api.post("/recurring/detect"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
    onError: () => Alert.alert("Scan failed", "Please try again in a bit."),
  });

  const confirmMute = (item: RecurringItem) => {
    Alert.alert(
      `Mute ${item.displayName}?`,
      "It will no longer appear in upcoming bills. You can re-detect it later with a rescan.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Mute", style: "destructive", onPress: () => muteMutation.mutate(item.id) },
      ]
    );
  };

  const data = recurringQuery.data;
  const items = data?.items ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recurring</Text>
        <TouchableOpacity
          onPress={() => rescanMutation.mutate()}
          disabled={rescanMutation.isPending}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Rescan transactions for recurring charges"
        >
          <Ionicons
            name="refresh"
            size={20}
            color={rescanMutation.isPending ? colors.textDim : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={recurringQuery.isRefetching}
            onRefresh={recurringQuery.refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Recurring per month</Text>
          <Text style={styles.totalAmount}>{formatCurrency(data?.monthlyTotal ?? 0)}</Text>
          <Text style={styles.totalHint}>
            Money already spoken for — every new subscription takes from your goals first.
          </Text>
        </View>

        {items.length === 0 && !recurringQuery.isLoading ? (
          <EmptyState
            icon="repeat"
            title="No recurring charges found"
            body="Once a merchant charges you on a steady schedule (2-3 times), it will show up here automatically."
            actionLabel="Scan now"
            onAction={() => rescanMutation.mutate()}
          />
        ) : (
          <View style={styles.listCard}>
            {items.map((item, i) => (
              <View key={item.id}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <RecurringRow item={item} onMute={() => confirmMute(item)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    headerTitle: { ...typography.h3 },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },
    totalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    totalLabel: { ...typography.bodySmall, marginBottom: spacing.xs },
    totalAmount: { ...typography.number, marginBottom: spacing.xs },
    totalHint: { ...typography.caption, lineHeight: 16 },
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    rowInfo: { flex: 1 },
    rowName: { ...typography.body, fontWeight: "600" },
    rowMeta: { ...typography.caption, marginTop: 2 },
    rowAmount: { ...typography.body, fontWeight: "700", marginRight: spacing.xs },
    divider: { height: 1, backgroundColor: colors.border },
  });

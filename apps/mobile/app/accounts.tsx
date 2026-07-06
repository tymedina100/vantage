import { useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { AccountsResponse, AccountSummary, formatCurrency } from "@/lib/finance";
import { spacing, radius } from "@/lib/theme";
import { useTheme, useThemedStyles, type Theme } from "@/lib/ThemeContext";
import { NetWorthChart } from "@/components/NetWorthChart";
import { EmptyState } from "@/components/EmptyState";
import type { NetWorthResponse } from "@worthlane/types";

const RANGE_OPTIONS = [
  { label: "1M", value: 30 },
  { label: "3M", value: 90 },
  { label: "1Y", value: 365 },
] as const;

const TYPE_ORDER = ["CHECKING", "SAVINGS", "INVESTMENT", "OTHER", "CREDIT", "LOAN"] as const;

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  INVESTMENT: "Investments",
  OTHER: "Other",
  CREDIT: "Credit cards",
  LOAN: "Loans",
};

function isDebt(type: string) {
  return type === "CREDIT" || type === "LOAN";
}

function AccountRow({ account }: { account: AccountSummary }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const debt = isDebt(account.type);
  return (
    <View style={styles.accountRow}>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountMeta}>
          {account.institutionName ?? (account.source === "MANUAL" ? "Manual account" : "Linked account")}
          {account.plaidNeedsRelink ? "  ·  Needs relink" : ""}
        </Text>
      </View>
      <Text style={[styles.accountBalance, debt && { color: colors.danger }]}>
        {debt && account.currentBalance > 0 ? "-" : ""}
        {formatCurrency(Math.abs(account.currentBalance))}
      </Text>
    </View>
  );
}

export default function AccountsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [range, setRange] = useState<number>(90);
  const chartWidth = Dimensions.get("window").width - spacing.md * 2 - spacing.md * 2;

  const netWorthQuery = useQuery({
    queryKey: ["net-worth", range],
    queryFn: () => api.get<NetWorthResponse>(`/accounts/net-worth?range=${range}`),
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.get<AccountsResponse>("/accounts"),
  });

  const accounts = accountsQuery.data?.accounts ?? [];
  const nw = netWorthQuery.data;
  const changeUp = (nw?.change ?? 0) >= 0;

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    accounts: accounts.filter((a) => a.type === type),
  })).filter((g) => g.accounts.length > 0);

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
        <Text style={styles.headerTitle}>Net worth</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={netWorthQuery.isRefetching || accountsQuery.isRefetching}
            onRefresh={() => {
              netWorthQuery.refetch();
              accountsQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total net worth</Text>
          <Text style={styles.heroAmount}>{formatCurrency(nw?.current ?? 0)}</Text>
          {nw && nw.history.length > 1 ? (
            <Text style={[styles.heroChange, { color: changeUp ? colors.success : colors.danger }]}>
              {changeUp ? "▲" : "▼"} {formatCurrency(Math.abs(nw.change))} (
              {Math.abs(nw.changePercent).toFixed(1)}%) over {range === 30 ? "1 month" : range === 90 ? "3 months" : "1 year"}
            </Text>
          ) : null}

          <View style={styles.chartWrap}>
            <NetWorthChart data={nw?.history ?? []} width={chartWidth} height={140} />
          </View>

          <View style={styles.rangeRow}>
            {RANGE_OPTIONS.map((option) => {
              const selected = range === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.rangeChip, selected && styles.rangeChipSelected]}
                  onPress={() => setRange(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${option.label} history`}
                >
                  <Text style={[styles.rangeChipText, selected && styles.rangeChipTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownCard, { marginRight: spacing.sm }]}>
            <Text style={styles.breakdownLabel}>Assets</Text>
            <Text style={[styles.breakdownAmount, { color: colors.success }]}>
              {formatCurrency(nw?.breakdown.assets ?? 0)}
            </Text>
          </View>
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownLabel}>Debts</Text>
            <Text style={[styles.breakdownAmount, { color: colors.danger }]}>
              {formatCurrency(nw?.breakdown.liabilities ?? 0)}
            </Text>
          </View>
        </View>

        {accounts.length === 0 && !accountsQuery.isLoading ? (
          <EmptyState
            icon="wallet"
            title="No accounts yet"
            body="Add a manual account from Profile to start tracking your net worth."
            actionLabel="Go to Profile"
            onAction={() => router.push("/(tabs)/profile")}
          />
        ) : (
          grouped.map((group) => (
            <View key={group.type} style={styles.group}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              <View style={styles.groupCard}>
                {group.accounts.map((account, i) => (
                  <View key={account.id}>
                    {i > 0 ? <View style={styles.divider} /> : null}
                    <AccountRow account={account} />
                  </View>
                ))}
              </View>
            </View>
          ))
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
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    heroLabel: { ...typography.bodySmall, marginBottom: spacing.xs },
    heroAmount: { ...typography.number, marginBottom: spacing.xs },
    heroChange: { fontSize: 13, fontWeight: "600", marginBottom: spacing.sm },
    chartWrap: { marginBottom: spacing.sm },
    rangeRow: { flexDirection: "row", gap: spacing.sm },
    rangeChip: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceAlt,
    },
    rangeChipSelected: { backgroundColor: colors.primaryDim },
    rangeChipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
    rangeChipTextSelected: { color: colors.primary },
    breakdownRow: { flexDirection: "row", marginBottom: spacing.lg },
    breakdownCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    breakdownLabel: { ...typography.caption, marginBottom: spacing.xs },
    breakdownAmount: { fontSize: 20, fontWeight: "700" },
    group: { marginBottom: spacing.md },
    groupTitle: {
      ...typography.label,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontSize: 12,
      marginBottom: spacing.sm,
    },
    groupCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
    },
    accountInfo: { flex: 1, marginRight: spacing.sm },
    accountName: { ...typography.body, fontWeight: "600" },
    accountMeta: { ...typography.caption, marginTop: 2 },
    accountBalance: { ...typography.body, fontWeight: "700" },
    divider: { height: 1, backgroundColor: colors.border },
  });

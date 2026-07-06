import { useState } from "react";
import {
  Dimensions,
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
import { formatCurrency } from "@/lib/finance";
import { spacing, radius } from "@/lib/theme";
import { useTheme, useThemedStyles, type Theme } from "@/lib/ThemeContext";
import { CashFlowBars } from "@/components/CashFlowBars";
import { EmptyState } from "@/components/EmptyState";
import type { CashFlowResponse, SpendingReport } from "@worthlane/types";

function monthKey(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ReportsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [monthOffset, setMonthOffset] = useState(0);
  const month = monthKey(monthOffset);
  const chartWidth = Dimensions.get("window").width - spacing.md * 2 - spacing.md * 2;

  const cashflowQuery = useQuery({
    queryKey: ["reports", "cashflow"],
    queryFn: () => api.get<CashFlowResponse>("/reports/cashflow?months=6"),
  });

  const spendingQuery = useQuery({
    queryKey: ["reports", "spending", month],
    queryFn: () => api.get<SpendingReport>(`/reports/spending?month=${month}`),
  });

  const cashflow = cashflowQuery.data?.months ?? [];
  const spending = spendingQuery.data;
  const hasAnyData = cashflow.some((m) => m.income > 0 || m.spending > 0);

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
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={cashflowQuery.isRefetching || spendingQuery.isRefetching}
            onRefresh={() => {
              cashflowQuery.refetch();
              spendingQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {!hasAnyData && !cashflowQuery.isLoading ? (
          <EmptyState
            icon="bar-chart"
            title="No report data yet"
            body="Once you have transactions, you'll see income vs. spending trends and a category breakdown here."
          />
        ) : (
          <>
            {/* Cash flow */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cash flow — last 6 months</Text>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Income</Text>
                <View style={[styles.legendDot, { backgroundColor: colors.danger, marginLeft: spacing.md }]} />
                <Text style={styles.legendText}>Spending</Text>
              </View>
              <CashFlowBars data={cashflow} width={chartWidth} height={150} />
            </View>

            {/* Month picker */}
            <View style={styles.monthPicker}>
              <TouchableOpacity
                onPress={() => setMonthOffset((v) => v - 1)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthTitle(month)}</Text>
              <TouchableOpacity
                onPress={() => setMonthOffset((v) => Math.min(0, v + 1))}
                disabled={monthOffset === 0}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={monthOffset === 0 ? colors.textDim : colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Month summary */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { marginRight: spacing.sm }]}>
                <Text style={styles.summaryLabel}>Spent</Text>
                <Text style={[styles.summaryAmount, { color: colors.danger }]}>
                  {formatCurrency(spending?.totalSpending ?? 0)}
                </Text>
              </View>
              <View style={[styles.summaryCard, { marginRight: spacing.sm }]}>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={[styles.summaryAmount, { color: colors.success }]}>
                  {formatCurrency(spending?.income ?? 0)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Saved</Text>
                <Text style={styles.summaryAmount}>
                  {spending?.savingsRate != null ? `${spending.savingsRate.toFixed(0)}%` : "—"}
                </Text>
              </View>
            </View>

            {/* Category breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Spending by category</Text>
              {spending && spending.breakdown.length > 0 ? (
                spending.breakdown.map((item) => {
                  const delta = item.amount - item.previousMonthAmount;
                  const deltaUp = delta > 0;
                  return (
                    <View key={item.categoryId ?? "uncategorized"} style={styles.categoryRow}>
                      <Text style={styles.categoryIcon}>{item.icon}</Text>
                      <View style={styles.categoryInfo}>
                        <View style={styles.categoryTopRow}>
                          <Text style={styles.categoryName}>{item.name}</Text>
                          <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
                        </View>
                        <View style={styles.categoryBarBg}>
                          <View
                            style={[
                              styles.categoryBarFill,
                              { width: `${Math.min(100, item.percent)}%`, backgroundColor: item.color },
                            ]}
                          />
                        </View>
                        {item.previousMonthAmount > 0 || item.amount > 0 ? (
                          <Text
                            style={[
                              styles.categoryDelta,
                              { color: deltaUp ? colors.warning : colors.textMuted },
                            ]}
                          >
                            {deltaUp ? "▲" : "▼"} {formatCurrency(Math.abs(delta))} vs last month
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noDataText}>No spending recorded this month.</Text>
              )}
            </View>
          </>
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    cardTitle: { ...typography.label, marginBottom: spacing.sm },
    legendRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
    legendText: { ...typography.caption },
    monthPicker: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    monthTitle: { ...typography.h3, fontSize: 17 },
    summaryRow: { flexDirection: "row", marginBottom: spacing.md },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm + 4,
    },
    summaryLabel: { ...typography.caption, marginBottom: 2 },
    summaryAmount: { fontSize: 16, fontWeight: "700", color: colors.text },
    categoryRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md },
    categoryIcon: { fontSize: 20, marginRight: spacing.sm, marginTop: 2 },
    categoryInfo: { flex: 1 },
    categoryTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
    categoryName: { ...typography.body, fontWeight: "600" },
    categoryAmount: { ...typography.body, fontWeight: "700" },
    categoryBarBg: {
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden",
      marginBottom: spacing.xs,
    },
    categoryBarFill: { height: 6, borderRadius: radius.full },
    categoryDelta: { fontSize: 11, fontWeight: "600" },
    noDataText: { ...typography.bodySmall, paddingVertical: spacing.sm },
  });

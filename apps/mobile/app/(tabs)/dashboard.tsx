import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { DashboardCard } from "@/components/DashboardCard";
import { NetWorthChart } from "@/components/NetWorthChart";
import { AccountsSection } from "@/components/AccountsSection";
import type { DashboardSummary, BudgetWithSpent, StreakStatus, NudgeMessage } from "@finance/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getBudgetColor(percentUsed: number): string {
  if (percentUsed >= 100) return colors.danger;
  if (percentUsed >= 80) return colors.warning;
  return colors.success;
}

function getBudgetMessage(b: BudgetWithSpent): string {
  if (b.remaining < 0) return `$${Math.abs(b.remaining).toFixed(0)} over — less for savings`;
  if (b.percentUsed >= 80) return `Only $${b.remaining.toFixed(0)} left before you lose this budget`;
  return `$${b.remaining.toFixed(0)} remaining`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBox({ height, width, style }: { height: number; width?: number | string; style?: object }) {
  return (
    <View
      style={[
        { height, width: width ?? "100%", backgroundColor: colors.surfaceAlt, borderRadius: radius.sm },
        style,
      ]}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View style={styles.content}>
      <View style={[styles.heroCard, { gap: spacing.sm }]}>
        <SkeletonBox height={14} width="35%" />
        <SkeletonBox height={52} width="55%" />
        <SkeletonBox height={90} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs }}>
          <SkeletonBox height={28} width="30%" />
          <SkeletonBox height={28} width="30%" />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.streakBadge, { gap: spacing.xs }]}>
            <SkeletonBox height={28} width={40} />
            <SkeletonBox height={12} width={60} />
          </View>
        ))}
      </View>
      {[1, 2].map((i) => (
        <View key={i} style={[styles.budgetItem, { gap: spacing.sm }]}>
          <SkeletonBox height={16} width="50%" />
          <SkeletonBox height={8} />
          <SkeletonBox height={12} width="40%" />
        </View>
      ))}
    </View>
  );
}

// ─── Streak Badge ──────────────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: StreakStatus }) {
  const label =
    streak.type === "DAILY_CHECKIN"
      ? "Daily"
      : streak.type === "WEEKLY_ON_BUDGET"
      ? "On Budget"
      : "No Impulse";

  const isActive = streak.isActiveToday && streak.currentCount > 0;
  const isAtRisk = !streak.isActiveToday && streak.currentCount > 0;
  const accentColor = isActive ? colors.gold : isAtRisk ? colors.warning : colors.textDim;

  return (
    <View style={[styles.streakBadge, { borderColor: isAtRisk ? colors.warning : colors.border }]}>
      <Text style={[styles.streakCount, { color: accentColor }]}>{streak.currentCount}</Text>
      <Text style={styles.streakLabel}>{label}</Text>
      {isAtRisk && <Text style={styles.streakWarning}>At risk!</Text>}
    </View>
  );
}

// ─── Nudge Card ───────────────────────────────────────────────────────────────

function NudgeCard({ nudge, onDismiss }: { nudge: NudgeMessage; onDismiss: () => void }) {
  return (
    <View style={styles.nudgeCard}>
      <Text style={styles.nudgeIcon}>💡</Text>
      <Text style={styles.nudgeText}>{nudge.message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.nudgeDismiss}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.md * 2 - spacing.md * 2; // screen - outer padding - card padding

  const { data: dashboard, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/dashboard"),
  });

  const { data: nudges } = useQuery({
    queryKey: ["nudges"],
    queryFn: () => api.get<NudgeMessage[]>("/nudges"),
  });

  const checkinMutation = useMutation({
    mutationFn: () => api.post("/streaks/checkin"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const dismissNudge = useMutation({
    mutationFn: (id: string) => api.post(`/nudges/${id}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nudges"] }),
  });

  useEffect(() => {
    checkinMutation.mutate();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={{ flex: 1 }}>
          <DashboardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const d = dashboard;
  const history = d?.netWorthHistory ?? [];

  // Month delta: compare first and last point in history
  const monthDelta =
    history.length >= 2
      ? history[history.length - 1].value - history[0].value
      : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Net Worth</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>{formatCurrency(d?.netWorth ?? 0)}</Text>
            {monthDelta !== null && (
              <View style={[
                styles.deltaBadge,
                { backgroundColor: monthDelta >= 0 ? colors.primary + "22" : colors.danger + "22" },
              ]}>
                <Text style={[
                  styles.deltaText,
                  { color: monthDelta >= 0 ? colors.primary : colors.danger },
                ]}>
                  {monthDelta >= 0 ? "↑" : "↓"}{formatCurrency(Math.abs(monthDelta))}
                </Text>
              </View>
            )}
          </View>

          {/* Net Worth Chart */}
          <View style={styles.chartContainer}>
            <NetWorthChart data={history} width={chartWidth} height={100} />
          </View>

          {/* Income / Spending */}
          <View style={styles.cashFlowRow}>
            <View style={styles.cashFlowItem}>
              <View style={[styles.cashFlowDot, { backgroundColor: colors.success }]} />
              <View>
                <Text style={styles.cashFlowLabel}>Income</Text>
                <Text style={[styles.cashFlowAmount, { color: colors.success }]}>
                  +{formatCurrency(d?.monthlyIncome ?? 0)}
                </Text>
              </View>
            </View>
            <View style={styles.cashFlowDivider} />
            <View style={styles.cashFlowItem}>
              <View style={[styles.cashFlowDot, { backgroundColor: colors.danger }]} />
              <View>
                <Text style={styles.cashFlowLabel}>Spending</Text>
                <Text style={[styles.cashFlowAmount, { color: colors.danger }]}>
                  -{formatCurrency(d?.monthlySpending ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Accounts ── */}
        {d?.accounts && d.accounts.length > 0 && (
          <AccountsSection accounts={d.accounts} />
        )}

        {/* ── Nudges ── */}
        {nudges && nudges.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            {nudges.slice(0, 2).map((n) => (
              <NudgeCard key={n.id} nudge={n} onDismiss={() => dismissNudge.mutate(n.id)} />
            ))}
          </View>
        )}

        {/* ── Streaks ── */}
        {d?.streaks && d.streaks.length > 0 && (
          <DashboardCard title="Streaks">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.streaksRow}>
                {d.streaks.map((s) => (
                  <StreakBadge key={s.type} streak={s} />
                ))}
              </View>
            </ScrollView>
          </DashboardCard>
        )}

        {/* ── Budget Overview ── */}
        {d?.budgets && d.budgets.length > 0 && (
          <DashboardCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Budgets</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/budgets")}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {d.budgets.slice(0, 3).map((b) => (
              <View key={b.id} style={styles.budgetItem}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetIcon}>{b.categoryIcon}</Text>
                  <Text style={styles.budgetName}>{b.categoryName}</Text>
                  <Text style={[styles.budgetAmount, { color: getBudgetColor(b.percentUsed) }]}>
                    {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                  </Text>
                </View>
                <View style={styles.budgetBarBg}>
                  <View
                    style={[
                      styles.budgetBarFill,
                      { width: `${Math.min(100, b.percentUsed)}%`, backgroundColor: getBudgetColor(b.percentUsed) },
                    ]}
                  />
                </View>
                <Text style={styles.budgetMessage}>{getBudgetMessage(b)}</Text>
              </View>
            ))}
            {d.budgets.length > 3 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => router.push("/(tabs)/budgets")}
              >
                <Text style={styles.showMoreText}>+{d.budgets.length - 3} more budgets</Text>
              </TouchableOpacity>
            )}
          </DashboardCard>
        )}

        {/* ── Goals ── */}
        {d?.goals && d.goals.length > 0 && (
          <DashboardCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goals</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/goals")}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {d.goals.map((g) => (
              <View key={g.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalIcon}>{g.icon ?? "🎯"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{g.name}</Text>
                    <Text style={styles.goalProgress}>
                      {formatCurrency(g.currentAmount)} of {formatCurrency(g.targetAmount)}
                    </Text>
                  </View>
                  <Text style={[styles.goalPercent, { color: g.percentComplete >= 100 ? colors.success : colors.primary }]}>
                    {Math.round(g.percentComplete)}%
                  </Text>
                </View>
                <View style={styles.budgetBarBg}>
                  <View
                    style={[
                      styles.budgetBarFill,
                      {
                        width: `${Math.min(100, g.percentComplete)}%`,
                        backgroundColor: g.percentComplete >= 100 ? colors.success : colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </DashboardCard>
        )}

        {/* ── Impulse Spending ── */}
        {d?.impulse != null && (
          <DashboardCard title="Impulse Spending" accent={colors.warning}>
            <View style={styles.impulseRow}>
              <View>
                <Text style={styles.impulseCount}>
                  {d.impulse.count} impulse {d.impulse.count === 1 ? "purchase" : "purchases"}
                </Text>
                <Text style={styles.impulseTotal}>{formatCurrency(d.impulse.total)} this month</Text>
              </View>
              {(d.impulse.previousWeekTotal > 0 || d.impulse.total > 0) && (
                <View style={styles.impulseTrend}>
                  <Text style={[
                    styles.impulseTrendArrow,
                    { color: d.impulse.total >= d.impulse.previousWeekTotal ? colors.danger : colors.success },
                  ]}>
                    {d.impulse.total >= d.impulse.previousWeekTotal ? "▲" : "▼"}
                  </Text>
                  <Text style={[
                    styles.impulseTrendLabel,
                    { color: d.impulse.total >= d.impulse.previousWeekTotal ? colors.danger : colors.success },
                  ]}>
                    {formatCurrency(Math.abs(d.impulse.total - d.impulse.previousWeekTotal))}{" "}
                    {d.impulse.total >= d.impulse.previousWeekTotal ? "more" : "less"} than last week
                  </Text>
                </View>
              )}
            </View>
            {d.impulse.count > 0 && (
              <Text style={styles.impulseNote}>
                That&apos;s {formatCurrency(d.impulse.total)} that didn&apos;t go toward your goals.
              </Text>
            )}
          </DashboardCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  // Hero card
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: "700",
    color: colors.text,
  },
  deltaBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chartContainer: {
    marginBottom: spacing.sm,
  },
  cashFlowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  cashFlowItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cashFlowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cashFlowDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  cashFlowLabel: {
    fontSize: 11,
    color: colors.textDim,
  },
  cashFlowAmount: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h3, fontSize: 16 },
  seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: "600" },

  // Streaks
  streaksRow: { flexDirection: "row", gap: spacing.sm },
  streakBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakCount: { fontSize: 28, fontWeight: "700", marginBottom: 2 },
  streakLabel: { ...typography.caption, textAlign: "center" },
  streakWarning: { color: colors.warning, fontSize: 10, marginTop: 2, fontWeight: "700" },

  // Nudge
  nudgeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  nudgeIcon: { fontSize: 16, marginTop: 1 },
  nudgeText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  nudgeDismiss: { color: colors.textDim, fontWeight: "700", fontSize: 14 },

  // Budget
  budgetItem: {
    marginBottom: spacing.sm,
  },
  budgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  budgetIcon: { fontSize: 18 },
  budgetName: { ...typography.label, flex: 1, fontSize: 13 },
  budgetAmount: { fontSize: 12, fontWeight: "600" },
  budgetBarBg: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  budgetBarFill: { height: "100%", borderRadius: radius.full },
  budgetMessage: { ...typography.caption },
  showMoreButton: {
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginTop: spacing.xs,
  },
  showMoreText: { ...typography.caption, color: colors.textMuted },

  // Goals
  goalCard: {
    marginBottom: spacing.sm,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  goalIcon: { fontSize: 22 },
  goalName: { ...typography.label, fontSize: 13 },
  goalProgress: { ...typography.caption, marginTop: 2 },
  goalPercent: { fontSize: 16, fontWeight: "700" },

  // Impulse
  impulseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  impulseCount: { ...typography.label },
  impulseTotal: { ...typography.bodySmall, marginTop: 2 },
  impulseTrend: { alignItems: "flex-end" },
  impulseTrendArrow: { fontSize: 18, fontWeight: "700" },
  impulseTrendLabel: { ...typography.caption, marginTop: 2, textAlign: "right" },
  impulseNote: { ...typography.caption, marginTop: spacing.sm, fontStyle: "italic" },
});

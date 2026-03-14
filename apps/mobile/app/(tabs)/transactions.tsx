import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { colors, spacing, radius, typography } from "@/lib/theme";
import type { Category } from "@finance/types";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  merchantName: string | null;
  note: string | null;
  isImpulse: boolean;
  category: { id: string; name: string; icon: string; color: string } | null;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(amount));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

function getDateRange(range: "this_month" | "last_month" | "all") {
  const now = new Date();
  if (range === "this_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      to: now.toISOString(),
    };
  }
  if (range === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  return { from: null, to: null };
}

function buildUrl(
  search: string,
  categoryId: string | null,
  dateRange: "this_month" | "last_month" | "all",
  limit: number
) {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);
  const { from, to } = getDateRange(dateRange);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return `/transactions?${params.toString()}`;
}

const DATE_RANGES = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "all", label: "All Time" },
] as const;

// ─── Transaction Detail Bottom Sheet ──────────────────────────────────────────

function TransactionDetailSheet({
  tx,
  categories,
  visible,
  onClose,
}: {
  tx: Transaction | null;
  categories: Category[];
  visible: boolean;
  onClose: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isImpulse, setIsImpulse] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (tx) {
      setCategoryId(tx.category?.id ?? null);
      setNote(tx.note ?? "");
      setIsImpulse(tx.isImpulse);
    }
  }, [tx?.id]);

  const mutation = useMutation({
    mutationFn: (data: object) => api.patch(`/transactions/${tx!.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      onClose();
    },
    onError: (e: unknown) =>
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update transaction."),
  });

  if (!tx) return null;
  const isExpense = tx.amount > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={sheet.overlay}
      >
        <View style={sheet.container}>
          {/* Header */}
          <View style={sheet.header}>
            <View style={[sheet.icon, { backgroundColor: `${tx.category?.color ?? colors.surfaceAlt}33` }]}>
              <Text style={{ fontSize: 24 }}>{tx.category?.icon ?? "📦"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sheet.merchant} numberOfLines={1}>
                {tx.merchantName ?? "Unknown"}
              </Text>
              <Text style={sheet.date}>{formatDateLong(tx.date)}</Text>
            </View>
            <Text style={[sheet.amount, { color: isExpense ? colors.danger : colors.success }]}>
              {isExpense ? "-" : "+"}{formatCurrency(tx.amount)}
            </Text>
          </View>

          {/* Category picker */}
          <Text style={sheet.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: spacing.md }}
          >
            <View style={{ flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.xs }}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    sheet.chip,
                    categoryId === c.id && { borderColor: c.color, backgroundColor: `${c.color}22` },
                  ]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Text style={{ fontSize: 14 }}>{c.icon}</Text>
                  <Text style={[sheet.chipText, categoryId === c.id && { color: c.color }]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Note */}
          <Text style={sheet.label}>Note</Text>
          <TextInput
            style={sheet.input}
            placeholder="Add a note..."
            placeholderTextColor={colors.textDim}
            value={note}
            onChangeText={setNote}
          />

          {/* Impulse toggle */}
          <View style={sheet.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={sheet.toggleLabel}>⚡ Impulse Purchase</Text>
              <Text style={sheet.toggleSub}>Unplanned or emotional buy</Text>
            </View>
            <Switch
              value={isImpulse}
              onValueChange={setIsImpulse}
              trackColor={{ false: colors.border, true: "rgba(245,158,11,0.4)" }}
              thumbColor={isImpulse ? colors.warning : colors.textDim}
            />
          </View>

          <TouchableOpacity
            style={[sheet.saveButton, mutation.isPending && { opacity: 0.6 }]}
            onPress={() =>
              mutation.mutate({ categoryId, note: note.trim() || null, isImpulse })
            }
            disabled={mutation.isPending}
          >
            <Text style={sheet.saveButtonText}>{mutation.isPending ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sheet.cancelButton} onPress={onClose}>
            <Text style={sheet.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Transaction Row ───────────────────────────────────────────────────────────

function TransactionRow({ tx, onPress }: { tx: Transaction; onPress: () => void }) {
  const isExpense = tx.amount > 0;
  const accentColor = tx.category?.color ?? colors.border;

  return (
    <TouchableOpacity
      style={[styles.txRow, { borderLeftColor: accentColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.txIcon, { backgroundColor: `${accentColor}22` }]}>
        <Text style={styles.txIconText}>{tx.category?.icon ?? "📦"}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txMerchant} numberOfLines={1}>
          {tx.merchantName ?? "Unknown"}
        </Text>
        <Text style={styles.txMeta}>
          {formatDate(tx.date)}
          {tx.category && ` · ${tx.category.name}`}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isExpense ? colors.danger : colors.success }]}>
          {isExpense ? "-" : "+"}{formatCurrency(tx.amount)}
        </Text>
        {tx.isImpulse && <Text style={styles.impulseBadge}>⚡</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"this_month" | "last_month" | "all">("this_month");
  const [limit, setLimit] = useState(50);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Reset limit when filters change
  const prevFiltersRef = useRef({ search, selectedCategoryId, dateRange });
  if (
    prevFiltersRef.current.search !== search ||
    prevFiltersRef.current.selectedCategoryId !== selectedCategoryId ||
    prevFiltersRef.current.dateRange !== dateRange
  ) {
    prevFiltersRef.current = { search, selectedCategoryId, dateRange };
    if (limit !== 50) setLimit(50);
  }

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["transactions", search, selectedCategoryId, dateRange, limit],
    queryFn: () =>
      api.get<TransactionsResponse>(buildUrl(search, selectedCategoryId, dateRange, limit)),
    staleTime: 10_000,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });

  const hasMore = data ? data.transactions.length < data.total : false;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header + Search */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TextInput
          style={styles.search}
          placeholder="Search merchants..."
          placeholderTextColor={colors.textDim}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Date range pills */}
      <View style={styles.dateRangeRow}>
        {DATE_RANGES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.dateChip, dateRange === r.value && styles.dateChipActive]}
            onPress={() => setDateRange(r.value)}
          >
            <Text
              style={[styles.dateChipText, dateRange === r.value && styles.dateChipTextActive]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filter chips */}
      {categories && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBar}
          contentContainerStyle={styles.categoryBarContent}
        >
          <TouchableOpacity
            style={[styles.catChip, !selectedCategoryId && styles.catChipActive]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={[styles.catChipText, !selectedCategoryId && styles.catChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.catChip,
                selectedCategoryId === c.id && {
                  borderColor: c.color,
                  backgroundColor: `${c.color}22`,
                },
              ]}
              onPress={() =>
                setSelectedCategoryId(selectedCategoryId === c.id ? null : c.id)
              }
            >
              <Text style={{ fontSize: 13 }}>{c.icon}</Text>
              <Text
                style={[
                  styles.catChipText,
                  selectedCategoryId === c.id && { color: c.color },
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={data?.transactions ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionRow tx={item} onPress={() => setSelectedTx(item)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={typography.body}>No transactions found.</Text>
              <Text style={[typography.bodySmall, { textAlign: "center" }]}>
                {selectedCategoryId || search
                  ? "Try adjusting your filters."
                  : "Connect a bank account to see your spending."}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setLimit((l) => l + 50)}
            >
              <Text style={styles.loadMoreText}>
                Load more ({data!.total - data!.transactions.length} remaining)
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <TransactionDetailSheet
        tx={selectedTx}
        categories={categories ?? []}
        visible={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.md, paddingTop: spacing.xl },
  title: { ...typography.h2, marginBottom: spacing.md },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateRangeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  dateChipText: { fontSize: 13, fontWeight: "500", color: colors.textMuted },
  dateChipTextActive: { color: colors.primary },
  categoryBar: { flexGrow: 0, marginBottom: spacing.sm },
  categoryBarContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  catChipText: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
  catChipTextActive: { color: colors.primary },
  list: { padding: spacing.md, gap: spacing.xs, paddingBottom: spacing.xxl },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderLeftWidth: 3,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txMerchant: { ...typography.label, marginBottom: 2 },
  txMeta: { ...typography.caption },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 15, fontWeight: "600" },
  impulseBadge: { fontSize: 13 },
  emptyState: { alignItems: "center", paddingTop: spacing.xxl, gap: spacing.sm },
  loadMoreButton: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  loadMoreText: { ...typography.bodySmall, color: colors.textMuted },
});

const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  icon: { width: 48, height: 48, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  merchant: { ...typography.h3, marginBottom: 2 },
  date: { ...typography.caption },
  amount: { fontSize: 20, fontWeight: "700" },
  label: { ...typography.label, marginBottom: spacing.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleLabel: { ...typography.label },
  toggleSub: { ...typography.caption, marginTop: 2 },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  saveButtonText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  cancelButton: { alignItems: "center", padding: spacing.sm },
  cancelButtonText: { ...typography.body, color: colors.textDim },
});

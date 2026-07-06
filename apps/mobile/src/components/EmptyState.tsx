import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "@/lib/theme";
import { useTheme, useThemedStyles, type Theme } from "@/lib/ThemeContext";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  icon: IoniconsName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Standard empty state: icon in a soft circle, title, one-line body, optional CTA. */
export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.button}
          onPress={onAction}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.primaryDim,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h3,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    body: {
      ...typography.bodySmall,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.lg,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });

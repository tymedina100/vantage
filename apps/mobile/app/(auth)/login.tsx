import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore } from "@/store/auth";
import { colors, spacing, radius, typography } from "@/lib/theme";

function getBiometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return "Face ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
  }
  return "Biometrics";
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");
  const { login, loginWithBiometric, biometricEnabled } = useAuthStore();

  const checkBiometrics = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (hasHardware && isEnrolled && biometricEnabled) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricLabel(getBiometricLabel(types));
      setBiometricAvailable(true);
      return true;
    }
    return false;
  }, [biometricEnabled]);

  const handleBiometricLogin = useCallback(async () => {
    setLoading(true);
    try {
      await loginWithBiometric();
      router.replace("/(tabs)/dashboard");
    } catch (e: unknown) {
      // Silently fail auto-prompt so the user can fall back to password.
      // Only show alert on explicit button tap (handled by callers).
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loginWithBiometric]);

  // Auto-prompt biometric on mount if enabled.
  useEffect(() => {
    checkBiometrics().then((available) => {
      if (available) {
        handleBiometricLogin().catch(() => {
          // Swallow — user will use password or tap the biometric button.
        });
      }
    });
  }, [checkBiometrics, handleBiometricLogin]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)/dashboard");
    } catch (e: unknown) {
      Alert.alert("Login failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricTap = async () => {
    setLoading(true);
    try {
      await loginWithBiometric();
      router.replace("/(tabs)/dashboard");
    } catch (e: unknown) {
      Alert.alert(
        `${biometricLabel} failed`,
        e instanceof Error ? e.message : "Please sign in with your password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>Finance</Text>
        <Text style={styles.tagline}>Your money, finally making sense.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textDim}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text>
        </TouchableOpacity>

        {biometricAvailable && (
          <TouchableOpacity
            style={[styles.biometricButton, loading && styles.buttonDisabled]}
            onPress={handleBiometricTap}
            disabled={loading}
          >
            <Text style={styles.biometricButtonText}>Sign in with {biometricLabel}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={{ color: colors.primary }}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  logo: {
    ...typography.numberLarge,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  biometricButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  biometricButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});

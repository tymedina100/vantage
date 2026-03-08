import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { api } from "@/lib/api";

interface AuthState {
  userId: string | null;
  email: string | null;
  isLoading: boolean;
  biometricEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  loginWithBiometric: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  isLoading: true,
  biometricEnabled: false,

  hydrate: async () => {
    const token = await SecureStore.getItemAsync("accessToken");
    const email = await SecureStore.getItemAsync("userEmail");
    const userId = await SecureStore.getItemAsync("userId");
    const biometricEnabled = (await SecureStore.getItemAsync("biometricEnabled")) === "true";
    if (token && userId) {
      set({ userId, email, isLoading: false, biometricEnabled });
    } else {
      set({ isLoading: false, biometricEnabled });
    }
  },

  login: async (email: string, password: string) => {
    const { user, accessToken, refreshToken } = await api.post<{
      user: { id: string; email: string };
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", { email, password });

    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    await SecureStore.setItemAsync("userId", user.id);
    await SecureStore.setItemAsync("userEmail", user.email);
    set({ userId: user.id, email: user.email });
  },

  register: async (email: string, password: string) => {
    const { user, accessToken, refreshToken } = await api.post<{
      user: { id: string; email: string };
      accessToken: string;
      refreshToken: string;
    }>("/auth/register", { email, password });

    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    await SecureStore.setItemAsync("userId", user.id);
    await SecureStore.setItemAsync("userEmail", user.email);
    set({ userId: user.id, email: user.email });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("userId");
    await SecureStore.deleteItemAsync("userEmail");
    set({ userId: null, email: null });
  },

  enableBiometric: async () => {
    await SecureStore.setItemAsync("biometricEnabled", "true");
    set({ biometricEnabled: true });
  },

  disableBiometric: async () => {
    await SecureStore.setItemAsync("biometricEnabled", "false");
    set({ biometricEnabled: false });
  },

  loginWithBiometric: async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to Finance",
      fallbackLabel: "Use Password",
      disableDeviceFallback: false,
    });

    if (!result.success) {
      throw new Error("Biometric authentication failed");
    }

    // Tokens are already stored — hydrate auth state from SecureStore.
    // If the access token is expired, api.ts will auto-refresh via the stored refresh token.
    const userId = await SecureStore.getItemAsync("userId");
    const email = await SecureStore.getItemAsync("userEmail");
    if (!userId) {
      throw new Error("No stored credentials. Please sign in with your password.");
    }
    set({ userId, email });
  },
}));

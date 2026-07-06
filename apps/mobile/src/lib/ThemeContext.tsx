import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import {
  darkColors,
  lightColors,
  makeTypography,
  radius,
  spacing,
  type ThemeColors,
  type Typography,
} from "./theme";

export interface Theme {
  scheme: "light" | "dark";
  colors: ThemeColors;
  typography: Typography;
  spacing: typeof spacing;
  radius: typeof radius;
}

const darkTheme: Theme = {
  scheme: "dark",
  colors: darkColors,
  typography: makeTypography(darkColors),
  spacing,
  radius,
};

const lightTheme: Theme = {
  scheme: "light",
  colors: lightColors,
  typography: makeTypography(lightColors),
  spacing,
  radius,
};

const ThemeContext = createContext<Theme>(darkTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const theme = useMemo(
    () => (systemScheme === "light" ? lightTheme : darkTheme),
    [systemScheme]
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Memoized themed StyleSheet for the active color scheme.
 * Usage: `const styles = useThemedStyles(createStyles);` where
 * `createStyles = ({ colors, typography }: Theme) => StyleSheet.create({...})`.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

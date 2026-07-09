"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  getSystemPrefersDark,
  readStoredThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme/constants";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isReady: boolean;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readResolvedFromDom(): ResolvedTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function readInitialPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  return readStoredThemePreference() ?? "system";
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setThemeState(readInitialPreference());
    setResolvedTheme(readResolvedFromDom());
    setIsReady(true);
  }, []);

  const setTheme = useCallback((preference: ThemePreference) => {
    const prefersDark = getSystemPrefersDark();
    const storedPreference = preference === "system" ? null : preference;
    const resolved = resolveTheme(storedPreference, prefersDark);

    setThemeState(preference);
    setResolvedTheme(resolved);
    applyResolvedTheme(resolved);

    try {
      if (preference === "system") {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
      }
    } catch {
      // localStorage indisponível
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = resolveTheme(null, media.matches);
      applyResolvedTheme(resolved);
      setResolvedTheme(resolved);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, isReady, setTheme, toggleTheme }),
    [theme, resolvedTheme, isReady, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }
  return context;
}

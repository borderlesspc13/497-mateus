"use client";

import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

function buildMuiTheme(mode: "light" | "dark") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#fafafa" : "#18181b",
        light: isDark ? "#ffffff" : "#3f3f46",
        dark: isDark ? "#e4e4e7" : "#09090b",
        contrastText: isDark ? "#18181b" : "#fafafa",
      },
      secondary: {
        main: isDark ? "#a1a1aa" : "#71717a",
        contrastText: "#fafafa",
      },
      error: {
        main: isDark ? "#ef4444" : "#dc2626",
      },
      background: {
        default: isDark ? "#09090b" : "#f4f4f5",
        paper: isDark ? "#18181b" : "#ffffff",
      },
      text: {
        primary: isDark ? "#fafafa" : "#18181b",
        secondary: isDark ? "#a1a1aa" : "#71717a",
      },
      divider: isDark ? "#3f3f46" : "#e4e4e7",
    },
    typography: {
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      fontSize: 14,
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 12,
          },
        },
      },
    },
  });
}

/** Provider escopado — usado apenas dentro de PremiumDataTable, não globalmente. */
export function MuiDataGridProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const muiTheme = useMemo(() => buildMuiTheme(resolvedTheme), [resolvedTheme]);

  return <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>;
}

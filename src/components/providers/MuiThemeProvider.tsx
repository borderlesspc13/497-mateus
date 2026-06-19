"use client";

import { ThemeProvider, createTheme } from "@mui/material";

const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#18181b",
      light: "#3f3f46",
      dark: "#09090b",
      contrastText: "#fafafa",
    },
    secondary: {
      main: "#71717a",
      contrastText: "#fafafa",
    },
    error: {
      main: "#dc2626",
    },
    background: {
      default: "#f4f4f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#18181b",
      secondary: "#71717a",
    },
    divider: "#e4e4e7",
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

/** Provider escopado — usado apenas dentro de PremiumDataTable, não globalmente. */
export function MuiDataGridProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}

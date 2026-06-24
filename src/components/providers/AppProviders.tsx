"use client";

import type { PropsWithChildren } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

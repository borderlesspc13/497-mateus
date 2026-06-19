"use client";

import type { PropsWithChildren } from "react";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <TooltipProvider delayDuration={200}>
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </TooltipProvider>
  );
}

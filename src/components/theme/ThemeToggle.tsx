"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme, isReady } = useTheme();
  const isDark = isReady && resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={className}
          onClick={toggleTheme}
          aria-label={
            isReady
              ? isDark
                ? "Ativar modo claro"
                : "Ativar modo escuro"
              : "Alternar tema"
          }
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isReady ? (isDark ? "Modo claro" : "Modo escuro") : "Alternar tema"}
      </TooltipContent>
    </Tooltip>
  );
}

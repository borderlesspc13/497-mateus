"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { AppShell } from "@/components/app-shell/AppShell";

const AUTH_ROUTES = new Set(["/login", "/cadastro"]);

export function RootLayoutClient({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  return (
    <AuthProvider>
      {isAuthRoute ? (
        <AuthShell>{children}</AuthShell>
      ) : (
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      )}
    </AuthProvider>
  );
}

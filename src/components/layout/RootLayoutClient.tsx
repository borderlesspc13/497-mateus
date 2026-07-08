"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { AppShell } from "@/components/app-shell/AppShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthShell } from "@/components/auth/AuthShell";
import { FirebaseAnalytics } from "@/components/firebase/FirebaseAnalytics";
import { AppProviders } from "@/components/providers/AppProviders";
import type { SessionUser } from "@/lib/auth/server";

const AUTH_ROUTES = new Set(["/login", "/cadastro"]);

type RootLayoutClientProps = PropsWithChildren<{
  initialUser: SessionUser | null;
}>;

export function RootLayoutClient({ children, initialUser }: RootLayoutClientProps) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  return (
    <AuthProvider initialServerUser={initialUser}>
      <AppProviders>
        <FirebaseAnalytics />
        {isAuthRoute ? (
          <AuthShell>{children}</AuthShell>
        ) : (
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        )}
      </AppProviders>
    </AuthProvider>
  );
}

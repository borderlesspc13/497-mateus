"use client";

import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";

export function AuthShell({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    router.replace("/");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="px-6 py-4">
          <CardContent className="p-0 text-sm text-muted-foreground">Carregando...</CardContent>
        </Card>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="px-6 py-4">
          <CardContent className="p-0 text-sm text-muted-foreground">Redirecionando...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/60 via-background to-background"
        aria-hidden
      />

      <header className="relative border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
              GO
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Gestão Operacional</div>
              <div className="text-xs text-muted-foreground">Consórcio</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        {children}
      </main>

      <footer className="relative border-t border-border bg-card/80 py-4 text-center text-xs text-muted-foreground backdrop-blur-md">
        Gestão Operacional · Consórcio
      </footer>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthShell({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    router.replace("/");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 shadow-sm">
          Carregando...
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center gap-3 px-4 sm:px-6">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">
            GO
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900">Gestão Operacional</div>
            <div className="text-xs text-zinc-500">Consórcio</div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-zinc-200 bg-white py-4 text-center text-xs text-zinc-500">
        Gestão Operacional · Consórcio
      </footer>
    </div>
  );
}

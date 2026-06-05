"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { clearServerSession } from "@/lib/firebase/auth-client";

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 shadow-sm">
        {message}
      </div>
    </div>
  );
}

export function AuthGate({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;

    let cancelled = false;

    async function redirectToLogin() {
      await clearServerSession().catch(() => undefined);
      if (cancelled) return;

      const redirect = pathname && pathname !== "/" ? pathname : "/";
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }

    void redirectToLogin();

    return () => {
      cancelled = true;
    };
  }, [loading, user, router, pathname]);

  if (loading) {
    return <AuthLoadingScreen message="Verificando sessão..." />;
  }

  if (!user) {
    return <AuthLoadingScreen message="Redirecionando para o login..." />;
  }

  return children;
}

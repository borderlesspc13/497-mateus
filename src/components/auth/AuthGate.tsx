"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthGate({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;
    const redirect = pathname && pathname !== "/" ? pathname : "/";
    router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 shadow-sm">
          Verificando sessão...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return children;
}

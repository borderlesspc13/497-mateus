"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { establishServerSession, signInWithEmail } from "@/lib/firebase/auth-client";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Informe o e-mail.");
      return;
    }
    if (!password) {
      setError("Informe a senha.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      await establishServerSession();
      router.replace(redirectTo.startsWith("/") ? redirectTo : "/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${panelClass()} overflow-hidden p-0`}>
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-zinc-900 text-sm font-bold text-white">
            GO
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
              Gestão Operacional
            </h1>
            <p className="text-sm text-zinc-600">Acesse com seu e-mail corporativo</p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 px-6 py-6 sm:px-8">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            E-mail <span className="text-red-600">*</span>
          </div>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={formControlClass()}
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Senha <span className="text-red-600">*</span>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={formControlClass()}
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar no sistema"}
        </button>
      </form>

      <p className="border-t border-zinc-100 px-6 py-4 text-center text-xs leading-5 text-zinc-500 sm:px-8">
        O acesso é provisionado pelo administrador do sistema. Em caso de dúvida, contate o suporte
        interno.
      </p>
    </div>
  );
}

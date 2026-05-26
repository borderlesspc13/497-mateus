"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signInWithEmail } from "@/lib/firebase/auth-client";
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
      router.replace(redirectTo.startsWith("/") ? redirectTo : "/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${panelClass()} p-6 sm:p-8`}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Entrar</h1>
        <p className="text-sm text-zinc-600">Acesse o sistema com seu e-mail e senha.</p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
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
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastro"
          className="font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          Criar cadastro
        </Link>
      </p>
    </div>
  );
}

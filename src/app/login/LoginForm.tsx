"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { establishServerSession, signInWithEmail } from "@/lib/firebase/auth-client";

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
    <Card className="overflow-hidden shadow-[var(--shadow-elevated)]">
      <CardHeader className="border-b border-border/60 bg-muted/40 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            GO
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Gestão Operacional
            </h1>
            <p className="text-sm text-muted-foreground">Acesse com seu e-mail corporativo</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-6 sm:px-8">
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <FormField label="E-mail" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </FormField>

          <FormField label="Senha" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </FormField>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={loading} className="h-11 w-full" size="lg">
            {loading ? "Entrando..." : "Entrar no sistema"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex-col border-t border-border/60 px-6 py-4 sm:px-8">
        <p className="text-center text-xs leading-5 text-muted-foreground">
          O acesso é provisionado pelo administrador do sistema. Em caso de dúvida, contate o suporte
          interno.
        </p>
      </CardFooter>
    </Card>
  );
}

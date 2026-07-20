"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { establishServerSession, signUpWithEmail } from "@/lib/firebase/auth-client";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";

export default function CadastroForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    void fetch("/api/auth/registration-allowed")
      .then(async (response) => {
        const data = (await response.json()) as { allowed?: boolean; error?: string };
        if (!alive) return;

        if (!response.ok) {
          setError(data.error ?? "Não foi possível verificar o cadastro.");
          return;
        }

        if (!data.allowed) {
          router.replace("/login");
          return;
        }
      })
      .catch(() => {
        if (!alive) return;
        setError("Não foi possível verificar o cadastro.");
      })
      .finally(() => {
        if (alive) setCheckingRegistration(false);
      });

    return () => {
      alive = false;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("Informe seu nome.");
      return;
    }
    if (!email.trim()) {
      setError("Informe o e-mail.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(nome, email, password);
      await establishServerSession();
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingRegistration) {
    return (
      <div className={`${panelClass()} p-6 sm:p-8`}>
        <p className="text-center text-sm text-muted-foreground">Verificando cadastro...</p>
      </div>
    );
  }

  return (
    <div className={`${panelClass()} p-6 sm:p-8`}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Cadastre-se para acessar o sistema operacional.</p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Nome <span className="text-red-600">*</span>
          </div>
          <input
            type="text"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome completo"
            className={formControlClass()}
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
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
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Senha <span className="text-red-600">*</span>
          </div>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={formControlClass()}
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Confirmar senha <span className="text-red-600">*</span>
          </div>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            className={formControlClass()}
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          Fazer login
        </Link>
      </p>
    </div>
  );
}

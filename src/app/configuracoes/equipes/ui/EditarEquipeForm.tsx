"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getEquipe, updateEquipe } from "@/actions/equipes";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";

type EditarEquipeFormProps = {
  id: string;
};

export default function EditarEquipeForm({ id }: EditarEquipeFormProps) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getEquipe(id)
      .then((item) => {
        if (!alive) return;
        if (!item) {
          setNotFound(true);
          return;
        }
        setNome(item.nome);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateEquipe(id, { nome });
      router.push("/configuracoes/equipes");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        Carregando...
      </div>
    );
  }

  if (notFound) {
    return (
      <PageFlowHeader
        crumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Equipes", href: "/configuracoes/equipes" },
          { label: "Erro" },
        ]}
        title="Equipe não encontrada"
        actions={
          <Link href="/configuracoes/equipes" className={backLinkClass()}>
            Voltar
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Equipes", href: "/configuracoes/equipes" },
          { label: "Editar" },
        ]}
        title={nome || "Editar equipe"}
        actions={
          <Link href="/configuracoes/equipes" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <form onSubmit={(e) => void onSave(e)} className={`${panelClass()} p-6`}>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Nome da equipe <span className="text-red-600">*</span>
          </div>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={formControlClass()}
            required
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </>
  );
}

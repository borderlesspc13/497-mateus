"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getEquipe, updateEquipe } from "@/actions/equipes";
import { listVendedoresMini } from "@/actions/vendedores";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { VendedorMini } from "@/lib/types/domain";

type EditarEquipeFormProps = {
  id: string;
};

export default function EditarEquipeForm({ id }: EditarEquipeFormProps) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [diretorId, setDiretorId] = useState("");
  const [vendedores, setVendedores] = useState<VendedorMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([getEquipe(id), listVendedoresMini()])
      .then(([item, vendedoresList]) => {
        if (!alive) return;
        if (!item) {
          setNotFound(true);
          return;
        }
        setNome(item.nome);
        setSupervisorId(item.supervisorId ?? "");
        setDiretorId(item.diretorId ?? "");
        setVendedores(vendedoresList);
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
      await updateEquipe(id, {
        nome,
        supervisorId: supervisorId || null,
        diretorId: diretorId || null,
      });
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
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
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
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Nome da equipe <span className="text-red-600">*</span>
            </div>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={formControlClass()}
              required
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Supervisor</div>
            <select
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              className={formControlClass()}
            >
              <option value="">Não definido</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Diretor</div>
            <select
              value={diretorId}
              onChange={(e) => setDiretorId(e.target.value)}
              className={formControlClass()}
            >
              <option value="">Não definido</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </>
  );
}

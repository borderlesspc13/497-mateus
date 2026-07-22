"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCampanha, updateCampanha } from "@/actions/campanhas";
import { backLinkClass, primaryCtaClass } from "@/components/page-flow/button-classes";
import { formControlClass, formSectionClass } from "@/components/ui/list-panel-classes";
import type { CampanhaRow } from "@/lib/types/domain";

type CampanhaFormProps =
  | { mode: "create" }
  | { mode: "edit"; item: CampanhaRow };

type FormState = {
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  ativa: boolean;
  destaque: boolean;
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formFromItem(item: CampanhaRow): FormState {
  return {
    titulo: item.titulo,
    descricao: item.descricao,
    dataInicio: toDateInput(item.dataInicio),
    dataFim: toDateInput(item.dataFim),
    ativa: item.ativa,
    destaque: item.destaque,
  };
}

export default function CampanhaForm(props: CampanhaFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    props.mode === "edit"
      ? formFromItem(props.item)
      : {
          titulo: "",
          descricao: "",
          dataInicio: toDateInput(new Date().toISOString()),
          dataFim: "",
          ativa: true,
          destaque: false,
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        dataInicio: new Date(`${form.dataInicio}T00:00:00`).toISOString(),
        dataFim: form.dataFim
          ? new Date(`${form.dataFim}T23:59:59`).toISOString()
          : null,
        ativa: form.ativa,
        destaque: form.destaque,
      };
      if (props.mode === "create") {
        await createCampanha(payload);
      } else {
        await updateCampanha(props.item.id, payload);
      }
      router.push("/configuracoes/campanhas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar campanha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`${formSectionClass()} space-y-5 p-5 sm:p-6`}>
      <label className="block">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Título <span className="text-red-600">*</span>
        </div>
        <input
          value={form.titulo}
          onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
          className={formControlClass()}
          placeholder="Ex.: Campanha março — crédito automóvel"
          required
        />
      </label>

      <label className="block">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Descrição <span className="text-red-600">*</span>
        </div>
        <textarea
          value={form.descricao}
          onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
          rows={3}
          className="w-full resize-y rounded-lg border border-border bg-card p-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          placeholder="Resumo da ação para o time ver no dashboard."
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Início <span className="text-red-600">*</span>
          </div>
          <input
            type="date"
            value={form.dataInicio}
            onChange={(e) => setForm((prev) => ({ ...prev, dataInicio: e.target.value }))}
            className={formControlClass()}
            required
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Fim (opcional)</div>
          <input
            type="date"
            value={form.dataFim}
            onChange={(e) => setForm((prev) => ({ ...prev, dataFim: e.target.value }))}
            className={formControlClass()}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={form.ativa}
            onChange={(e) => setForm((prev) => ({ ...prev, ativa: e.target.checked }))}
            className="h-4 w-4 rounded border-border"
          />
          Campanha ativa
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={form.destaque}
            onChange={(e) => setForm((prev) => ({ ...prev, destaque: e.target.checked }))}
            className="h-4 w-4 rounded border-border"
          />
          Destacar no dashboard
        </label>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className={primaryCtaClass()}>
          {saving ? "Salvando..." : props.mode === "create" ? "Criar campanha" : "Salvar alterações"}
        </button>
        <Link href="/configuracoes/campanhas" className={backLinkClass()}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

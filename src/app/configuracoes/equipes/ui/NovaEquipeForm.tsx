"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEquipe } from "@/actions/equipes";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";

export default function NovaEquipeForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createEquipe({ nome });
      router.push("/configuracoes/equipes");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      <label className="block">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Nome da equipe <span className="text-red-600">*</span>
        </div>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Equipe Prospera"
          className={formControlClass()}
          required
        />
      </label>

      {error ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/configuracoes/equipes")}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground/70 hover:bg-muted/50"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

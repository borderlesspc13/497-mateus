"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createVendedor } from "@/actions/vendedores";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { EquipeMini } from "@/lib/types/domain";

type NovaVendedorFormProps = {
  equipes: EquipeMini[];
};

export default function NovaVendedorForm({ equipes }: NovaVendedorFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    equipeId: equipes[0]?.id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createVendedor(form);
      router.push("/configuracoes/vendedores");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      {equipes.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Cadastre uma equipe antes.{" "}
          <Link href="/configuracoes/equipes/nova" className="font-medium underline">
            Nova equipe
          </Link>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Equipe <span className="text-red-600">*</span>
          </div>
          <select
            value={form.equipeId}
            onChange={(e) => setForm((p) => ({ ...p, equipeId: e.target.value }))}
            className={formControlClass()}
            disabled={equipes.length === 0}
            required
          >
            {equipes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Nome <span className="text-red-600">*</span>
          </div>
          <input
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            className={formControlClass()}
            required
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Telefone <span className="text-red-600">*</span>
          </div>
          <input
            value={form.telefone}
            onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
            className={formControlClass()}
            required
          />
        </label>
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            E-mail <span className="text-red-600">*</span>
          </div>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className={formControlClass()}
            required
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/configuracoes/vendedores")}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || equipes.length === 0}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateVendedor } from "@/actions/vendedores";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { EquipeMini, VendedorRow } from "@/lib/types/domain";

type EditarVendedorFormProps = {
  item: VendedorRow;
  equipes: EquipeMini[];
};

export default function EditarVendedorForm({ item, equipes }: EditarVendedorFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: item.nome,
    email: item.email,
    telefone: item.telefone,
    equipeId: item.equipeId,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateVendedor(item.id, form);
      router.push("/configuracoes/vendedores");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Vendedores", href: "/configuracoes/vendedores" },
          { label: "Editar" },
        ]}
        title={item.nome}
        actions={
          <Link href="/configuracoes/vendedores" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <form onSubmit={(e) => void onSave(e)} className={`${panelClass()} p-6`}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Equipe <span className="text-red-600">*</span>
            </div>
            <select
              value={form.equipeId}
              onChange={(e) => setForm((p) => ({ ...p, equipeId: e.target.value }))}
              className={formControlClass()}
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

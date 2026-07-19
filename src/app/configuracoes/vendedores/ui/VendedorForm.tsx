"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createVendedor, updateVendedor } from "@/actions/vendedores";
import { FormField } from "@/components/form/FormField";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { EquipeMini, VendedorRow } from "@/lib/types/domain";

type VendedorFormProps =
  | { mode: "create"; equipes: EquipeMini[] }
  | { mode: "edit"; item: VendedorRow; equipes: EquipeMini[] };

export default function VendedorForm(props: VendedorFormProps) {
  const { mode, equipes } = props;
  const router = useRouter();
  const [form, setForm] = useState({
    nome: mode === "edit" ? props.item.nome : "",
    email: mode === "edit" ? props.item.email : "",
    telefone: mode === "edit" ? props.item.telefone : "",
    equipeId: mode === "edit" ? props.item.equipeId : (equipes[0]?.id ?? ""),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (mode === "create") {
        await createVendedor(form);
      } else {
        await updateVendedor(props.item.id, form);
      }
      router.push("/configuracoes/vendedores");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const formBody = (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      {mode === "create" && equipes.length === 0 ? (
        <AlertBanner tone="warning">
          Cadastre uma equipe antes.{" "}
          <Link href="/configuracoes/equipes/nova" className="font-medium underline">
            Nova equipe
          </Link>
        </AlertBanner>
      ) : null}

      <div className={mode === "create" ? "mt-4 grid gap-4 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
        <FormField label="Equipe" htmlFor="vendedor-equipe" required className="md:col-span-2">
          <select
            id="vendedor-equipe"
            value={form.equipeId}
            onChange={(e) => setForm((p) => ({ ...p, equipeId: e.target.value }))}
            className={formControlClass()}
            disabled={mode === "create" && equipes.length === 0}
            required
          >
            {equipes.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Nome" htmlFor="vendedor-nome" required>
          <input
            id="vendedor-nome"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            className={formControlClass()}
            required
          />
        </FormField>
        <FormField label="Telefone" htmlFor="vendedor-telefone" required>
          <input
            id="vendedor-telefone"
            value={form.telefone}
            onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
            className={formControlClass()}
            required
          />
        </FormField>
        <FormField label="E-mail" htmlFor="vendedor-email" required className="md:col-span-2">
          <input
            id="vendedor-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className={formControlClass()}
            required
          />
        </FormField>
      </div>

      {error ? (
        <AlertBanner tone="error" className="mt-4">
          {error}
        </AlertBanner>
      ) : null}

      {mode === "create" ? (
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
      ) : (
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      )}
    </form>
  );

  if (mode === "edit") {
    return (
      <>
        <PageFlowHeader
          crumbs={[
            { label: "Configurações", href: "/configuracoes" },
            { label: "Vendedores", href: "/configuracoes/vendedores" },
            { label: "Editar" },
          ]}
          title={props.item.nome}
          actions={
            <Link href="/configuracoes/vendedores" className={backLinkClass()}>
              Voltar à lista
            </Link>
          }
        />
        {formBody}
      </>
    );
  }

  return formBody;
}

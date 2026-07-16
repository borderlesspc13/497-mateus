"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteAdministradora } from "@/actions/administradoras";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  dangerActionClass,
  dataTableClass,
  formControlClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { AdministradoraRow } from "@/lib/types/domain";

type AdministradorasClientProps = {
  initialItems: AdministradoraRow[];
};

export default function AdministradorasClient({ initialItems }: AdministradorasClientProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => {
      const hay = `${a.nome} ${a.cnpj} ${a.email ?? ""} ${a.telefone ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Excluir administradora?",
      description: "Esta ação não pode ser desfeita. Os planos vinculados podem ser afetados.",
      variant: "destructive",
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    setError(null);
    setDeletingId(id);
    try {
      await deleteAdministradora(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DataListPanel
      toolbar={
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, CNPJ, e-mail..."
            className={formControlClass("lg")}
          />
          <Link href="/administradoras/nova" className={primaryActionClass()}>
            Nova administradora
          </Link>
        </>
      }
      error={
        error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Nenhuma administradora cadastrada" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Cadastre a primeira administradora parceira do sistema."
              : "Tente outro termo na busca."
          }
          action={
            items.length === 0 ? (
              <Link href="/administradoras/nova" className={primaryActionClass()}>
                Nova administradora
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className={tableWrapClass()}>
          <table className={dataTableClass()}>
            <thead>
              <tr>
                <th className={tableHeadCellClass()}>Nome</th>
                <th className={tableHeadCellClass()}>CNPJ</th>
                <th className={tableHeadCellClass()}>Contato</th>
                <th className={tableHeadCellClass()}>Cidade/UF</th>
                <th className={tableHeadCellClass()}>Criado em</th>
                <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id} className={tableRowClass(index)}>
                  <td className={`${tableCellClass()} font-medium text-zinc-900`}>{row.nome}</td>
                  <td className={tableCellClass()}>{row.cnpj}</td>
                  <td className={tableCellClass()}>
                    <div className="leading-5">
                      <div className="text-foreground">{row.contatoPrincipal || "—"}</div>
                      <div className="text-xs text-muted-foreground">{row.email || "—"}</div>
                    </div>
                  </td>
                  <td className={tableCellClass()}>
                    {`${row.enderecoCidade || "—"}${row.enderecoUf ? `/${row.enderecoUf}` : ""}`}
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap`}>
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/planos?administradoraId=${encodeURIComponent(row.id)}`}
                        className={secondaryActionClass()}
                      >
                        Planos
                      </Link>
                      <Link href={`/administradoras/${row.id}`} className={secondaryActionClass()}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void onDelete(row.id)}
                        disabled={deletingId === row.id}
                        className={dangerActionClass()}
                      >
                        {deletingId === row.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DataListPanel>
  );
}

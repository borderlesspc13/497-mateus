"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteVendedor } from "@/actions/vendedores";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
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
import type { VendedorRow } from "@/lib/types/domain";

type VendedoresClientProps = {
  initialItems: VendedorRow[];
};

export default function VendedoresClient({ initialItems }: VendedoresClientProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.nome} ${item.email} ${item.telefone} ${item.equipe.nome}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Excluir vendedor?",
      description: "Esta ação não pode ser desfeita.",
      variant: "destructive",
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    setError(null);
    setDeletingId(id);
    try {
      await deleteVendedor(id);
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
            placeholder="Buscar por nome, e-mail ou equipe..."
            className={formControlClass("lg")}
          />
          <Link href="/configuracoes/vendedores/nova" className={primaryActionClass()}>
            Novo vendedor
          </Link>
        </>
      }
      error={
        error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Nenhum vendedor cadastrado" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Cadastre vendedores e vincule-os às equipes."
              : "Tente outro termo de busca."
          }
          action={
            items.length === 0 ? (
              <Link href="/configuracoes/vendedores/nova" className={primaryActionClass()}>
                Novo vendedor
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
                <th className={tableHeadCellClass()}>E-mail</th>
                <th className={tableHeadCellClass()}>Telefone</th>
                <th className={tableHeadCellClass()}>Equipe</th>
                <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id} className={tableRowClass(index)}>
                  <td className={`${tableCellClass()} font-medium text-foreground`}>{item.nome}</td>
                  <td className={tableCellClass()}>{item.email}</td>
                  <td className={tableCellClass()}>{item.telefone}</td>
                  <td className={tableCellClass()}>{item.equipe.nome}</td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/configuracoes/vendedores/${item.id}`}
                        className={secondaryActionClass()}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => void onDelete(item.id)}
                        disabled={deletingId === item.id}
                        className={dangerActionClass()}
                      >
                        {deletingId === item.id ? "Excluindo..." : "Excluir"}
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

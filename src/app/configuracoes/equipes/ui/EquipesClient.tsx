"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteEquipe } from "@/actions/equipes";
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
import type { EquipeRow } from "@/lib/types/domain";

type EquipesClientProps = {
  initialItems: EquipeRow[];
};

export default function EquipesClient({ initialItems }: EquipesClientProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.nome.toLowerCase().includes(q));
  }, [items, query]);

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Excluir equipe?",
      description: "Esta ação não pode ser desfeita.",
      variant: "destructive",
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    setError(null);
    setDeletingId(id);
    try {
      await deleteEquipe(id);
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
            placeholder="Buscar por nome..."
            className={formControlClass("lg")}
          />
          <Link href="/configuracoes/equipes/nova" className={primaryActionClass()}>
            Nova equipe
          </Link>
        </>
      }
      error={
        error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Nenhuma equipe cadastrada" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Cadastre equipes para vincular vendedores e vendas."
              : "Tente outro termo de busca."
          }
          action={
            items.length === 0 ? (
              <Link href="/configuracoes/equipes/nova" className={primaryActionClass()}>
                Nova equipe
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
                <th className={tableHeadCellClass()}>Cadastrada em</th>
                <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id} className={tableRowClass(index)}>
                  <td className={`${tableCellClass()} font-medium text-zinc-900`}>{item.nome}</td>
                  <td className={`${tableCellClass()} whitespace-nowrap`}>
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/configuracoes/equipes/${item.id}`}
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

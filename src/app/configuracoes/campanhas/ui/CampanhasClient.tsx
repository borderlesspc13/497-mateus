"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteCampanha } from "@/actions/campanhas";
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
import type { CampanhaRow } from "@/lib/types/domain";

type CampanhasClientProps = {
  initialItems: CampanhaRow[];
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export default function CampanhasClient({ initialItems }: CampanhasClientProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.titulo.toLowerCase().includes(q) ||
        item.descricao.toLowerCase().includes(q),
    );
  }, [items, query]);

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Excluir campanha?",
      description: "Esta ação não pode ser desfeita.",
      variant: "destructive",
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    setError(null);
    setDeletingId(id);
    try {
      await deleteCampanha(id);
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
            placeholder="Buscar campanha..."
            className={formControlClass("lg")}
          />
          <Link href="/configuracoes/campanhas/nova" className={primaryActionClass()}>
            Nova campanha
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
          title={items.length === 0 ? "Nenhuma campanha cadastrada" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Cadastre campanhas para destacar ações comerciais no dashboard."
              : "Tente outro termo de busca."
          }
          action={
            items.length === 0 ? (
              <Link href="/configuracoes/campanhas/nova" className={primaryActionClass()}>
                Nova campanha
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className={tableWrapClass()}>
          <table className={dataTableClass()}>
            <thead>
              <tr>
                <th className={tableHeadCellClass()}>Título</th>
                <th className={tableHeadCellClass()}>Período</th>
                <th className={tableHeadCellClass()}>Status</th>
                <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id} className={tableRowClass(index)}>
                  <td className={tableCellClass()}>
                    <div className="font-medium text-foreground">{item.titulo}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {item.descricao}
                    </div>
                  </td>
                  <td className={`${tableCellClass()} whitespace-nowrap text-sm`}>
                    {formatDate(item.dataInicio)}
                    {item.dataFim ? ` → ${formatDate(item.dataFim)}` : " · sem fim"}
                  </td>
                  <td className={tableCellClass()}>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          item.ativa
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {item.ativa ? "Ativa" : "Inativa"}
                      </span>
                      {item.destaque ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                          Destaque
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className={`${tableCellClass()} pr-0 text-right`}>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/configuracoes/campanhas/${item.id}`}
                        className={secondaryActionClass()}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className={dangerActionClass()}
                        disabled={deletingId === item.id}
                        onClick={() => void onDelete(item.id)}
                      >
                        {deletingId === item.id ? "..." : "Excluir"}
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

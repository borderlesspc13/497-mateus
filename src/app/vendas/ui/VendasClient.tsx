"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteVenda, listVendasPaginated } from "@/actions/vendas";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PendenciaBadge } from "@/components/vendas/PendenciaBadge";
import {
  dangerActionClass,
  dataTableClass,
  desktopTableClass,
  formControlClass,
  listErrorClass,
  mobileListCardClass,
  mobileListClass,
  primaryActionClass,
  rowActionsClass,
  secondaryActionClass,
  tableCellClass,
  tableColFromClass,
  tableHeadCellClass,
  tableLinkClass,
  tableMutedTextClass,
  tablePrimaryTextClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { VendasListPage } from "@/lib/firestore/repository";
import type { AdministradoraMini, VendaRow } from "@/lib/types/domain";
import {
  useVendasPaginatedList,
} from "@/lib/vendas/use-vendas-paginated-list";
import { PaginatedListFooter } from "@/components/ui/PaginatedListFooter";
import { ExportButton } from "@/components/export/ExportButton";
import { VENDAS_EXPORT_COLUMNS } from "@/lib/export/columns/vendas";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";
import type { VendasListFilters } from "@/lib/firestore/repository";

const VENDAS_DEFAULT_FILTERS: VendasListFilters = {};

type VendasClientProps = {
  initialPage: VendasListPage;
  initialAdministradoras: AdministradoraMini[];
};

export default function VendasClient({
  initialPage,
  initialAdministradoras,
}: VendasClientProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [query, setQuery] = useState("");
  const [statusOperacional, setStatusOperacional] = useState<"" | VendaRow["statusOperacional"]>("");
  const [administradoraId, setAdministradoraId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    visibleItems,
    hasMore,
    isLoadingMore,
    isResetting,
    error,
    setError,
    loadMore,
    resetAndFetch,
    removeItem,
  } = useVendasPaginatedList<VendaRow>({
    initialPage,
    initialFilters: VENDAS_DEFAULT_FILTERS,
    fetchPage: listVendasPaginated,
    clientFilter: useCallback(
      (items: VendaRow[]) => {
        const q = query.trim().toLowerCase();
        return items.filter((v) => {
          if (!q) return true;
          const hay = `${v.titulo} ${v.numeroContrato} ${v.grupo} ${v.cota} ${v.consorciado?.nome ?? ""} ${v.consorciado?.cpf_cnpj ?? ""} ${v.administradora?.nome ?? ""} ${v.plano?.nome ?? ""}`.toLowerCase();
          return hay.includes(q);
        });
      },
      [query],
    ),
  });

  const skipInitialFilterFetch = useRef(true);

  useEffect(() => {
    const nextFilters = {
      ...(statusOperacional ? { statusOperacional } : {}),
      ...(administradoraId ? { administradoraId } : {}),
    };

    if (skipInitialFilterFetch.current) {
      skipInitialFilterFetch.current = false;
      return;
    }

    void resetAndFetch(nextFilters);
  }, [statusOperacional, administradoraId, resetAndFetch]);

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "Excluir venda?",
      description: "Esta ação não pode ser desfeita.",
      variant: "destructive",
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    setError(null);
    setDeletingId(id);
    try {
      await deleteVenda(id);
      removeItem(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  const showEmpty = !isResetting && visibleItems.length === 0;
  const hasServerFilters = Boolean(statusOperacional || administradoraId);

  function VendaActions({ venda }: { venda: VendaRow }) {
    return (
      <div className={rowActionsClass()}>
        <Link href={`/vendas/${venda.id}`} className={secondaryActionClass()}>
          Editar
        </Link>
        <button
          type="button"
          onClick={() => void onDelete(venda.id)}
          disabled={deletingId === venda.id}
          className={dangerActionClass()}
        >
          {deletingId === venda.id ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    );
  }

  return (
    <DataListPanel
      toolbar={
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por contrato, grupo, cota ou consorciado..."
            className={formControlClass("lg")}
          />
          <select
            value={administradoraId}
            onChange={(e) => setAdministradoraId(e.target.value)}
            className={formControlClass("md")}
          >
            <option value="">Todas administradoras</option>
            {initialAdministradoras.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <select
            value={statusOperacional}
            onChange={(e) => setStatusOperacional(e.target.value as typeof statusOperacional)}
            className={formControlClass("sm")}
          >
            <option value="">Todos status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INADIMPLENTE">Inadimplente</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <Link href="/vendas/nova" className={`${primaryActionClass()} w-full sm:w-auto`}>
            Nova venda
          </Link>
          <ExportButton
            fileNameBase="vendas"
            sheetName="Vendas"
            rows={visibleItems}
            columns={VENDAS_EXPORT_COLUMNS}
            partialExport={hasMore}
          />
        </>
      }
      error={error ? <div className={listErrorClass()}>{error}</div> : null}
    >
      {isResetting ? (
        <TableSkeleton rows={8} columns={6} />
      ) : showEmpty ? (
        <EmptyState
          title={
            !hasServerFilters && !query.trim()
              ? "Nenhuma venda cadastrada"
              : "Nenhum resultado encontrado"
          }
          description={
            !hasServerFilters && !query.trim()
              ? "Cadastre a primeira venda vinculada a um consorciado e administradora."
              : "Ajuste os filtros ou o termo de busca para ver outros registros."
          }
          action={
            !hasServerFilters && !query.trim() ? (
              <Link href="/vendas/nova" className={primaryActionClass()}>
                Nova venda
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className={mobileListClass()}>
            {visibleItems.map((v) => (
              <article key={v.id} className={mobileListCardClass()}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{v.numeroContrato}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Grupo {v.grupo} · Cota {v.cota}
                    </p>
                  </div>
                  <StatusBadge status={v.statusOperacional} />
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  {v.consorciado ? (
                    <Link href={`/consorciados/${v.consorciado.id}`} className={tableLinkClass()}>
                      {v.consorciado.nome}
                    </Link>
                  ) : (
                    <p className="text-foreground/80">—</p>
                  )}
                  <p className="text-muted-foreground">
                    {v.administradora?.nome ?? "—"}
                    {v.plano?.nome ? ` · ${v.plano.nome}` : ""}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <PendenciaBadge venda={v} />
                    <span className="tabular-nums font-medium text-foreground">
                      {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-border/60 pt-3">
                  <VendaActions venda={v} />
                </div>
              </article>
            ))}
          </div>

          <div className={`${desktopTableClass()} ${tableWrapClass()}`}>
            <table className={dataTableClass()}>
              <thead>
                <tr>
                  <th className={tableHeadCellClass()}>Contrato</th>
                  <th className={tableHeadCellClass()}>Grupo / Cota</th>
                  <th className={tableHeadCellClass()}>Consorciado</th>
                  <th className={`${tableHeadCellClass()} ${tableColFromClass("lg")}`}>
                    Equipe / Vendedor
                  </th>
                  <th className={`${tableHeadCellClass()} ${tableColFromClass("md")}`}>
                    Administradora
                  </th>
                  <th className={`${tableHeadCellClass()} ${tableColFromClass("xl")}`}>Plano</th>
                  <th className={tableHeadCellClass()}>Status</th>
                  <th className={`${tableHeadCellClass()} ${tableColFromClass("lg")}`}>Pós-venda</th>
                  <th className={tableHeadCellClass()}>Valor</th>
                  <th className={`${tableHeadCellClass()} ${tableColFromClass("lg")}`}>
                    Data da venda
                  </th>
                  <th className={`${tableHeadCellClass()} ${tableColFromClass("xl")}`}>Criado em</th>
                  <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((v, index) => (
                  <tr key={v.id} className={tableRowClass(index)}>
                    <td className={`${tableCellClass()} ${tablePrimaryTextClass()}`}>
                      {v.numeroContrato}
                    </td>
                    <td className={tableCellClass()}>
                      <div className="leading-5">
                        <div className="text-foreground">
                          {v.grupo} / {v.cota}
                        </div>
                        <div className={tableMutedTextClass()}>Venc. dia {v.dataVencimento}</div>
                      </div>
                    </td>
                    <td className={tableCellClass()}>
                      <div className="leading-5">
                        {v.consorciado ? (
                          <Link href={`/consorciados/${v.consorciado.id}`} className={tableLinkClass()}>
                            {v.consorciado.nome}
                          </Link>
                        ) : (
                          <div className="text-foreground/80">—</div>
                        )}
                        {v.consorciado?.cpf_cnpj ? (
                          <div className={tableMutedTextClass()}>{v.consorciado.cpf_cnpj}</div>
                        ) : null}
                      </div>
                    </td>
                    <td className={`${tableCellClass()} ${tableColFromClass("lg")}`}>
                      <div className="leading-5">
                        <div className="text-foreground">{v.equipe?.nome ?? "—"}</div>
                        <div className={tableMutedTextClass()}>{v.vendedor?.nome ?? "—"}</div>
                      </div>
                    </td>
                    <td className={`${tableCellClass()} ${tableColFromClass("md")}`}>
                      <div className="leading-5">
                        <Link
                          href={`/administradoras/${v.administradoraId}`}
                          className={tableLinkClass()}
                        >
                          {v.administradora?.nome ?? "—"}
                        </Link>
                        <div className={tableMutedTextClass()}>{v.administradora?.cnpj ?? ""}</div>
                      </div>
                    </td>
                    <td className={`${tableCellClass()} ${tableColFromClass("xl")}`}>
                      <div className="leading-5">
                        {v.plano ? (
                          <Link href={`/planos/${v.plano.id}`} className={tableLinkClass()}>
                            {v.plano.nome}
                          </Link>
                        ) : (
                          <div className="text-foreground/80">—</div>
                        )}
                        {v.plano?.tipoBem ? (
                          <div className={tableMutedTextClass()}>{v.plano.tipoBem}</div>
                        ) : null}
                      </div>
                    </td>
                    <td className={tableCellClass()}>
                      <StatusBadge status={v.statusOperacional} />
                    </td>
                    <td className={`${tableCellClass()} ${tableColFromClass("lg")}`}>
                      <PendenciaBadge venda={v} />
                    </td>
                    <td className={`${tableCellClass()} whitespace-nowrap tabular-nums`}>
                      {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                    </td>
                    <td className={`${tableCellClass()} whitespace-nowrap ${tableColFromClass("lg")}`}>
                      {v.dataVenda ? new Date(v.dataVenda).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className={`${tableCellClass()} whitespace-nowrap ${tableColFromClass("xl")}`}>
                      {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className={`${tableCellClass()} pr-0 text-right`}>
                      <VendaActions venda={v} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginatedListFooter
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void loadMore()}
            columns={6}
            skeletonRows={4}
          />
        </>
      )}
    </DataListPanel>
  );
}

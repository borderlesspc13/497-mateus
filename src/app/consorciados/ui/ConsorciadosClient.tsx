"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ConsorciadoVendaSearchIndexRow } from "@/actions/consorciados";
import { ConsorciadoAdvancedSearch } from "@/components/consorciados/ConsorciadoAdvancedSearch";
import { ExportButton } from "@/components/export/ExportButton";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginatedListFooter } from "@/components/ui/PaginatedListFooter";
import { SummaryChip } from "@/components/ui/SummaryChip";
import {
  dataTableClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import { buildConsorciadoVendaStatsMap } from "@/lib/consorciados/consorciado-venda-stats";
import {
  buildConsorciadoExportRows,
  CONSORCIADOS_EXPORT_COLUMNS,
} from "@/lib/export/columns/consorciados";
import {
  EMPTY_CONSORCIADO_SEARCH_FILTERS,
  filterConsorciados,
  hasActiveConsorciadoSearchFilters,
  type ConsorciadoSearchFilters,
} from "@/lib/consorciados/filter-consorciados";
import type { ConsorciadoRow } from "@/lib/types/domain";

const CONSORCIADOS_PAGE_SIZE = 25;

type ConsorciadosClientProps = {
  initialItems: ConsorciadoRow[];
  initialVendasIndex: ConsorciadoVendaSearchIndexRow[];
};

export default function ConsorciadosClient({
  initialItems,
  initialVendasIndex,
}: ConsorciadosClientProps) {
  const router = useRouter();
  const [items] = useState<ConsorciadoRow[]>(initialItems);
  const [vendasIndex] = useState<ConsorciadoVendaSearchIndexRow[]>(initialVendasIndex);
  const [filters, setFilters] = useState<ConsorciadoSearchFilters>(EMPTY_CONSORCIADO_SEARCH_FILTERS);
  const [visibleCount, setVisibleCount] = useState(CONSORCIADOS_PAGE_SIZE);

  function handleFiltersChange(nextFilters: ConsorciadoSearchFilters) {
    setFilters(nextFilters);
    setVisibleCount(CONSORCIADOS_PAGE_SIZE);
  }

  const vendaStatsMap = useMemo(
    () => buildConsorciadoVendaStatsMap(vendasIndex),
    [vendasIndex],
  );

  const filtered = useMemo(
    () => filterConsorciados(items, vendasIndex, filters),
    [items, vendasIndex, filters],
  );

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const exportRows = useMemo(
    () => buildConsorciadoExportRows(visibleItems, vendaStatsMap),
    [visibleItems, vendaStatsMap],
  );

  const hasMore = visibleCount < filtered.length;
  const hasFilters = hasActiveConsorciadoSearchFilters(filters);

  function loadMore() {
    setVisibleCount((current) =>
      Math.min(current + CONSORCIADOS_PAGE_SIZE, filtered.length),
    );
  }

  function openFicha(consorciadoId: string) {
    router.push(`/consorciados/${consorciadoId}`);
  }

  return (
    <div className="space-y-5">
      <ConsorciadoAdvancedSearch
        filters={filters}
        onChange={handleFiltersChange}
        resultCount={filtered.length}
        totalCount={items.length}
      />

      <DataListPanel
        title="Resultados da consulta"
        description={
          hasFilters
            ? "Clique em uma linha ou em «Abrir ficha» para ver produtos contratados e históricos."
            : "Listagem completa. Use a busca avançada acima para refinar por contrato, grupo ou cota."
        }
        toolbar={
          <ExportButton
            fileNameBase="consorciados"
            sheetName="Consorciados"
            rows={exportRows}
            columns={CONSORCIADOS_EXPORT_COLUMNS}
            partialExport={hasMore}
          />
        }
        error={null}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "Nenhum consorciado na base" : "Nenhum resultado encontrado"}
            description={
              items.length === 0
                ? "Consorciados são vinculados automaticamente ao registrar vendas. Quando houver cadastros, eles aparecerão aqui."
                : "Ajuste os filtros de nome, CPF, contrato, grupo ou cota e tente novamente."
            }
          />
        ) : (
          <>
            <div className={tableWrapClass()}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Nome</th>
                    <th className={tableHeadCellClass()}>CPF / CNPJ</th>
                    <th className={tableHeadCellClass()}>Telefone</th>
                    <th className={tableHeadCellClass()}>Cotas</th>
                    <th className={tableHeadCellClass()}>Situação</th>
                    <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item, index) => {
                    const stats = vendaStatsMap.get(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`${tableRowClass(index)} cursor-pointer hover:bg-muted/50`}
                        onClick={() => openFicha(item.id)}
                      >
                        <td className={`${tableCellClass()} font-medium text-foreground`}>
                          {item.nome}
                        </td>
                        <td className={tableCellClass()}>{item.cpf_cnpj}</td>
                        <td className={tableCellClass()}>{item.telefone}</td>
                        <td className={tableCellClass()}>
                          <span className="tabular-nums text-sm text-foreground/80">
                            {stats?.totalCotas ?? 0}
                          </span>
                        </td>
                        <td className={tableCellClass()}>
                          <div className="flex flex-wrap gap-1.5">
                            {(stats?.inadimplentes ?? 0) > 0 ? (
                              <SummaryChip
                                label="Inadimpl."
                                value={stats!.inadimplentes}
                                tone="red"
                              />
                            ) : null}
                            {(stats?.inconsistentes ?? 0) > 0 ? (
                              <SummaryChip
                                label="Inconsist."
                                value={stats!.inconsistentes}
                                tone="yellow"
                              />
                            ) : null}
                            {!stats || (stats.inadimplentes === 0 && stats.inconsistentes === 0) ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : null}
                          </div>
                        </td>
                        <td
                          className={`${tableCellClass()} pr-0 text-right`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openFicha(item.id)}
                            className={secondaryActionClass()}
                          >
                            Abrir ficha
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginatedListFooter
              hasMore={hasMore}
              isLoadingMore={false}
              onLoadMore={loadMore}
              columns={6}
              skeletonRows={4}
            />
          </>
        )}
      </DataListPanel>

      <p className="text-center text-xs text-muted-foreground">
        Novos consorciados podem ser cadastrados durante o fluxo de{" "}
        <Link href="/vendas/nova" className="font-medium text-muted-foreground underline-offset-2 hover:underline">
          Nova venda
        </Link>
        .
      </p>
    </div>
  );
}

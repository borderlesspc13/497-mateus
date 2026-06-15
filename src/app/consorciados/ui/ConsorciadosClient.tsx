"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { listConsorciados } from "@/lib/firestore/consorciados-client";
import { listVendasSearchIndex } from "@/lib/firestore/vendas-search-client";
import {
  EMPTY_CONSORCIADO_SEARCH_FILTERS,
  filterConsorciados,
  hasActiveConsorciadoSearchFilters,
  type ConsorciadoSearchFilters,
} from "@/lib/consorciados/filter-consorciados";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginatedListFooter } from "@/components/ui/PaginatedListFooter";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  dataTableClass,
  formControlClass,
  panelClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { ConsorciadoRow } from "@/lib/types/domain";

const CONSORCIADOS_PAGE_SIZE = 25;

function SearchField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block min-w-0 flex-1 basis-48">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={formControlClass()}
      />
    </label>
  );
}

export default function ConsorciadosClient() {
  const router = useRouter();
  const [items, setItems] = useState<ConsorciadoRow[]>([]);
  const [vendasIndex, setVendasIndex] = useState<Awaited<ReturnType<typeof listVendasSearchIndex>>>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ConsorciadoSearchFilters>(EMPTY_CONSORCIADO_SEARCH_FILTERS);
  const [visibleCount, setVisibleCount] = useState(CONSORCIADOS_PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void Promise.all([listConsorciados(), listVendasSearchIndex()])
      .then(([consorciados, vendas]) => {
        if (!alive) return;
        setItems(consorciados);
        setVendasIndex(vendas);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar consorciados.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => filterConsorciados(items, vendasIndex, filters),
    [items, vendasIndex, filters],
  );

  useEffect(() => {
    setVisibleCount(CONSORCIADOS_PAGE_SIZE);
  }, [filters]);

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;
  const hasFilters = hasActiveConsorciadoSearchFilters(filters);

  function updateFilter<K extends keyof ConsorciadoSearchFilters>(key: K, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function loadMore() {
    setVisibleCount((current) =>
      Math.min(current + CONSORCIADOS_PAGE_SIZE, filtered.length),
    );
  }

  if (loading) {
    return (
      <div className={`${panelClass()} p-6`}>
        <TableSkeleton rows={6} columns={5} />
      </div>
    );
  }

  return (
    <DataListPanel
      title="Consulta de consorciados"
      toolbar={
        <div className="w-full space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <SearchField
              label="Nome"
              value={filters.nome}
              onChange={(value) => updateFilter("nome", value)}
              placeholder="Nome do consorciado"
            />
            <SearchField
              label="CPF / CNPJ"
              value={filters.cpf}
              onChange={(value) => updateFilter("cpf", value)}
              placeholder="000.000.000-00"
            />
            <SearchField
              label="Número do contrato"
              value={filters.contrato}
              onChange={(value) => updateFilter("contrato", value)}
              placeholder="Ex.: 123456"
            />
            <SearchField
              label="Grupo"
              value={filters.grupo}
              onChange={(value) => updateFilter("grupo", value)}
              placeholder="Ex.: A100"
            />
            <SearchField
              label="Cota"
              value={filters.cota}
              onChange={(value) => updateFilter("cota", value)}
              placeholder="Ex.: 025"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-zinc-500">
              {hasFilters
                ? `${filtered.length} resultado(s) encontrado(s)`
                : filtered.length > CONSORCIADOS_PAGE_SIZE
                  ? `Exibindo ${visibleItems.length} de ${filtered.length} consorciado(s)`
                  : `${filtered.length} consorciado(s) cadastrado(s)`}
            </div>
            <div className="flex flex-wrap gap-2">
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_CONSORCIADO_SEARCH_FILTERS)}
                  className={secondaryActionClass()}
                >
                  Limpar filtros
                </button>
              ) : null}
              <Link href="/consorciados/nova" className={primaryActionClass()}>
                Novo consorciado
              </Link>
            </div>
          </div>
        </div>
      }
      error={
        error ? (
          <AlertBanner tone="error">{error}</AlertBanner>
        ) : null
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "Nenhum consorciado cadastrado" : "Nenhum resultado encontrado"}
          description={
            items.length === 0
              ? "Quando houver cadastros, eles aparecerão aqui para consulta."
              : "Ajuste os filtros e tente novamente."
          }
          action={
            items.length === 0 ? (
              <Link href="/consorciados/nova" className={primaryActionClass()}>
                Cadastrar consorciado
              </Link>
            ) : undefined
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
                  <th className={tableHeadCellClass()}>E-mail</th>
                  <th className={tableHeadCellClass()}>Cadastrado em</th>
                  <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`${tableRowClass(index)} cursor-pointer hover:bg-zinc-50/80`}
                    onClick={() => router.push(`/consorciados/${item.id}`)}
                  >
                    <td className={`${tableCellClass()} font-medium text-zinc-900`}>{item.nome}</td>
                    <td className={tableCellClass()}>{item.cpf_cnpj}</td>
                    <td className={tableCellClass()}>{item.telefone}</td>
                    <td className={tableCellClass()}>{item.email}</td>
                    <td className={`${tableCellClass()} whitespace-nowrap`}>
                      {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
                    </td>
                    <td
                      className={`${tableCellClass()} pr-0 text-right`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/consorciados/${item.id}`} className={secondaryActionClass()}>
                        Abrir ficha
                      </Link>
                    </td>
                  </tr>
                ))}
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
  );
}

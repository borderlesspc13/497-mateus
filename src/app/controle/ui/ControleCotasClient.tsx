"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listPlanosMiniByAdministradora } from "@/actions/planos";
import { listVendasPaginated } from "@/actions/vendas";
import { listVendedoresMiniByEquipe } from "@/actions/vendedores";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PosVendaBadge } from "@/components/ui/PosVendaBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { VendaAtendimentoDrawer } from "@/components/vendas/VendaAtendimentoDrawer";
import { StatusOperacionalQuickEditModal } from "@/components/vendas/StatusOperacionalQuickEditModal";
import {
  dataTableClass,
  formControlClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { VendasListFilters, VendasListPage } from "@/lib/firestore/repository";
import type {
  AdministradoraMini,
  EquipeMini,
  PlanoMini,
  StatusInconsistencia,
  StatusOperacionalCota,
  StatusPosVenda,
  VendaRow,
  VendedorMini,
} from "@/lib/types/domain";
import { useVendasPaginatedList } from "@/lib/vendas/use-vendas-paginated-list";
import { PaginatedListFooter } from "@/components/ui/PaginatedListFooter";
import { ExportButton } from "@/components/export/ExportButton";
import {
  getControleExportColumns,
  getControleExportFileNameBase,
  getControleExportSheetName,
} from "@/lib/export/columns/controle";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

export type ControleModo = "inadimplencia" | "inconsistencia" | "pos-venda";

const INADIMPLENCIA_DEFAULT_FILTERS: VendasListFilters = { statusOperacional: "INADIMPLENTE" };
const INCONSISTENCIA_DEFAULT_FILTERS: VendasListFilters = { statusInconsistencia: "INCONSISTENTE" };
const EMPTY_FILTERS: VendasListFilters = {};

type ControleFilterOptions = {
  administradoras: AdministradoraMini[];
  equipes: EquipeMini[];
};

type ControleCotasClientProps =
  | {
      modo: "inadimplencia" | "inconsistencia";
      initialPage: VendasListPage;
      filterOptions: ControleFilterOptions;
      initialItems?: never;
    }
  | {
      modo: "pos-venda";
      initialItems: VendaRow[];
      initialPage?: never;
      filterOptions?: ControleFilterOptions;
    };

export default function ControleCotasClient(props: ControleCotasClientProps) {
  const { modo } = props;
  const filterOptions = props.filterOptions ?? { administradoras: [], equipes: [] };

  const defaultStatusFilter: "" | StatusOperacionalCota =
    modo === "inadimplencia" ? "INADIMPLENTE" : "";
  const defaultInconsistenciaFilter: "" | StatusInconsistencia =
    modo === "inconsistencia" ? "INCONSISTENTE" : "";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | StatusOperacionalCota>(defaultStatusFilter);
  const [inconsistenciaFilter, setInconsistenciaFilter] = useState<"" | StatusInconsistencia>(
    defaultInconsistenciaFilter,
  );
  const [posVendaFilter, setPosVendaFilter] = useState<"" | StatusPosVenda>(
    modo === "pos-venda" ? "PENDENTE" : "",
  );
  const [equipeId, setEquipeId] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [administradoraId, setAdministradoraId] = useState("");
  const [planoId, setPlanoId] = useState("");
  const [dataVendaFrom, setDataVendaFrom] = useState("");
  const [dataVendaTo, setDataVendaTo] = useState("");
  const [vendedores, setVendedores] = useState<VendedorMini[]>([]);
  const [planos, setPlanos] = useState<PlanoMini[]>([]);
  const [selectedVenda, setSelectedVenda] = useState<VendaRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusEditVenda, setStatusEditVenda] = useState<VendaRow | null>(null);

  const isPaginated = modo !== "pos-venda";
  const initialFilters =
    modo === "inadimplencia"
      ? INADIMPLENCIA_DEFAULT_FILTERS
      : modo === "inconsistencia"
        ? INCONSISTENCIA_DEFAULT_FILTERS
        : EMPTY_FILTERS;

  const clientFilter = useCallback(
    (items: VendaRow[]) => {
      const q = query.trim().toLowerCase();
      return items.filter((v) => {
        if (modo === "pos-venda") {
          if (posVendaFilter && v.statusPosVenda !== posVendaFilter) return false;
          if (equipeId && v.equipeId !== equipeId) return false;
          if (vendedorId && v.vendedorId !== vendedorId) return false;
          if (administradoraId && v.administradoraId !== administradoraId) return false;
          if (planoId && v.planoId !== planoId) return false;
          const dateKey = (v.dataVenda ?? v.createdAt)?.slice(0, 10) ?? "";
          if (dataVendaFrom && (!dateKey || dateKey < dataVendaFrom)) return false;
          if (dataVendaTo && (!dateKey || dateKey > dataVendaTo)) return false;
        }
        if (!q) return true;
        const hay = `${v.numeroContrato} ${v.grupo} ${v.cota} ${v.consorciado?.nome ?? ""} ${v.administradora?.nome ?? ""} ${v.plano?.nome ?? ""} ${v.equipe?.nome ?? ""} ${v.vendedor?.nome ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    },
    [
      administradoraId,
      dataVendaFrom,
      dataVendaTo,
      equipeId,
      modo,
      planoId,
      posVendaFilter,
      query,
      vendedorId,
    ],
  );

  const paginated = useVendasPaginatedList<VendaRow>({
    initialPage: isPaginated
      ? props.initialPage
      : { items: props.initialItems, lastDocId: null, hasMore: false },
    initialFilters,
    fetchPage: listVendasPaginated,
    clientFilter,
  });

  const {
    visibleItems: paginatedVisibleItems,
    hasMore,
    isLoadingMore,
    isResetting,
    error: paginatedError,
    loadMore,
    resetAndFetch,
    replaceItem,
    removeItem,
  } = paginated;

  const [legacyItems, setLegacyItems] = useState<VendaRow[]>(
    !isPaginated ? props.initialItems : [],
  );

  const legacyItemsKey = useMemo(
    () => (!isPaginated ? props.initialItems.map((item) => item.id).join(",") : ""),
    [isPaginated, props.initialItems],
  );

  useEffect(() => {
    if (!isPaginated) {
      setLegacyItems(props.initialItems);
    }
  }, [isPaginated, legacyItemsKey, props.initialItems]);

  useEffect(() => {
    if (!equipeId) {
      setVendedores([]);
      setVendedorId("");
      return;
    }
    let alive = true;
    void listVendedoresMiniByEquipe(equipeId)
      .then((rows) => {
        if (!alive) return;
        setVendedores(rows);
        setVendedorId((current) => (rows.some((row) => row.id === current) ? current : ""));
      })
      .catch(() => {
        if (!alive) return;
        setVendedores([]);
        setVendedorId("");
      });
    return () => {
      alive = false;
    };
  }, [equipeId]);

  useEffect(() => {
    if (!administradoraId) {
      setPlanos([]);
      setPlanoId("");
      return;
    }
    let alive = true;
    void listPlanosMiniByAdministradora(administradoraId)
      .then((rows) => {
        if (!alive) return;
        setPlanos(rows);
        setPlanoId((current) => (rows.some((row) => row.id === current) ? current : ""));
      })
      .catch(() => {
        if (!alive) return;
        setPlanos([]);
        setPlanoId("");
      });
    return () => {
      alive = false;
    };
  }, [administradoraId]);

  const skipInitialFilterFetch = useRef(true);
  useEffect(() => {
    if (!isPaginated) return;

    const nextFilters: VendasListFilters = {};
    if (modo === "inadimplencia" && statusFilter) {
      nextFilters.statusOperacional = statusFilter;
    }
    if (modo === "inconsistencia" && inconsistenciaFilter) {
      nextFilters.statusInconsistencia = inconsistenciaFilter;
    }
    if (equipeId) nextFilters.equipeId = equipeId;
    if (vendedorId) nextFilters.vendedorId = vendedorId;
    if (administradoraId) nextFilters.administradoraId = administradoraId;
    if (planoId) nextFilters.planoId = planoId;
    if (dataVendaFrom) nextFilters.dataVendaFrom = dataVendaFrom;
    if (dataVendaTo) nextFilters.dataVendaTo = dataVendaTo;

    if (skipInitialFilterFetch.current) {
      skipInitialFilterFetch.current = false;
      return;
    }

    void resetAndFetch(nextFilters);
  }, [
    administradoraId,
    dataVendaFrom,
    dataVendaTo,
    equipeId,
    inconsistenciaFilter,
    isPaginated,
    modo,
    planoId,
    resetAndFetch,
    statusFilter,
    vendedorId,
  ]);

  const visibleItems = isPaginated ? paginatedVisibleItems : clientFilter(legacyItems);

  function openDrawer(venda: VendaRow) {
    setSelectedVenda(venda);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function onPosVendaCompleted(vendaId: string) {
    const updater = (item: VendaRow) =>
      item.id === vendaId ? { ...item, statusPosVenda: "FEITO" as const } : item;

    if (isPaginated) {
      replaceItem(vendaId, updater);
    } else {
      setLegacyItems((current) => current.map(updater));
    }

    setSelectedVenda((current) =>
      current?.id === vendaId ? { ...current, statusPosVenda: "FEITO" } : current,
    );
  }


  function openStatusEdit(venda: VendaRow) {
    setStatusEditVenda(venda);
  }

  function closeStatusEdit() {
    setStatusEditVenda(null);
  }

  function onStatusOperacionalUpdated(vendaId: string, novoStatus: StatusOperacionalCota) {
    const shouldRemoveFromList =
      modo === "inadimplencia" &&
      Boolean(statusFilter) &&
      novoStatus !== statusFilter;

    if (shouldRemoveFromList) {
      removeItem(vendaId);
    } else {
      replaceItem(vendaId, (item) =>
        item.id === vendaId ? { ...item, statusOperacional: novoStatus } : item,
      );
    }

    setSelectedVenda((current) =>
      current?.id === vendaId ? { ...current, statusOperacional: novoStatus } : current,
    );
  }

  function clearAdvancedFilters() {
    setEquipeId("");
    setVendedorId("");
    setAdministradoraId("");
    setPlanoId("");
    setDataVendaFrom("");
    setDataVendaTo("");
  }

  const defaultTipo =
    modo === "inconsistencia"
      ? ("INCONSISTENCIA" as const)
      : modo === "pos-venda"
        ? ("POS_VENDA" as const)
        : ("COBRANCA" as const);

  const emptyDescription =
    modo === "inconsistencia"
      ? "Ajuste os filtros ou marque cotas como inconsistentes na operação diária."
      : modo === "pos-venda"
        ? "Não há vendas recentes nem pendentes de pós-venda com os filtros atuais."
        : "Ajuste os filtros avançados ou o termo de busca.";

  const isResettingList = isPaginated && isResetting;
  const showEmpty = !isResettingList && visibleItems.length === 0;
  const exportColumns = useMemo(() => getControleExportColumns(modo), [modo]);
  const hasAdvancedFilters = Boolean(
    equipeId || vendedorId || administradoraId || planoId || dataVendaFrom || dataVendaTo,
  );

  return (
    <>
      <DataListPanel
        description="Use os filtros avançados para refinar a listagem e exporte os registros visíveis."
        toolbar={
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar contrato, grupo, cota, consorciado..."
                className={formControlClass("lg")}
              />
              {modo === "inadimplencia" ? (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className={formControlClass("md")}
                >
                  <option value="">Todos os status</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="INADIMPLENTE">Inadimplente</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              ) : null}
              {modo === "inconsistencia" ? (
                <select
                  value={inconsistenciaFilter}
                  onChange={(e) =>
                    setInconsistenciaFilter(e.target.value as typeof inconsistenciaFilter)
                  }
                  className={formControlClass("md")}
                >
                  <option value="">Todas</option>
                  <option value="INCONSISTENTE">Inconsistentes</option>
                  <option value="CONSISTENTE">Consistentes</option>
                </select>
              ) : null}
              {modo === "pos-venda" ? (
                <select
                  value={posVendaFilter}
                  onChange={(e) => setPosVendaFilter(e.target.value as typeof posVendaFilter)}
                  className={formControlClass("md")}
                >
                  <option value="">Todos</option>
                  <option value="PENDENTE">Pendentes</option>
                  <option value="FEITO">Feitos</option>
                </select>
              ) : null}
              <ExportButton
                fileNameBase={getControleExportFileNameBase(modo)}
                sheetName={getControleExportSheetName(modo)}
                rows={visibleItems}
                columns={exportColumns}
                partialExport={isPaginated && hasMore}
              />
            </div>

            <div className="grid w-full gap-2 rounded-xl border border-border bg-muted/50 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <label className="block min-w-0">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Equipe
                </span>
                <select
                  value={equipeId}
                  onChange={(e) => setEquipeId(e.target.value)}
                  className={formControlClass()}
                >
                  <option value="">Todas as equipes</option>
                  {filterOptions.equipes.map((equipe) => (
                    <option key={equipe.id} value={equipe.id}>
                      {equipe.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Vendedor
                </span>
                <select
                  value={vendedorId}
                  onChange={(e) => setVendedorId(e.target.value)}
                  className={formControlClass()}
                  disabled={!equipeId}
                >
                  <option value="">{equipeId ? "Todos os vendedores" : "Selecione uma equipe"}</option>
                  {vendedores.map((vendedor) => (
                    <option key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Data venda (de)
                </span>
                <input
                  type="date"
                  value={dataVendaFrom}
                  onChange={(e) => setDataVendaFrom(e.target.value)}
                  className={formControlClass()}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Data venda (até)
                </span>
                <input
                  type="date"
                  value={dataVendaTo}
                  onChange={(e) => setDataVendaTo(e.target.value)}
                  className={formControlClass()}
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Administradora
                </span>
                <select
                  value={administradoraId}
                  onChange={(e) => setAdministradoraId(e.target.value)}
                  className={formControlClass()}
                >
                  <option value="">Todas</option>
                  {filterOptions.administradoras.map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Plano
                </span>
                <select
                  value={planoId}
                  onChange={(e) => setPlanoId(e.target.value)}
                  className={formControlClass()}
                  disabled={!administradoraId}
                >
                  <option value="">
                    {administradoraId ? "Todos os planos" : "Selecione uma administradora"}
                  </option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {hasAdvancedFilters ? (
              <div className="flex justify-end">
                <button type="button" className={secondaryActionClass()} onClick={clearAdvancedFilters}>
                  Limpar filtros avançados
                </button>
              </div>
            ) : null}
          </div>
        }
        error={
          paginatedError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {paginatedError}
            </div>
          ) : null
        }
      >
        {isResettingList ? (
          <TableSkeleton rows={8} columns={6} />
        ) : showEmpty ? (
          <EmptyState title="Nenhuma cota encontrada" description={emptyDescription} />
        ) : (
          <>
            <div className={tableWrapClass()}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Contrato</th>
                    <th className={tableHeadCellClass()}>Grupo / Cota</th>
                    <th className={tableHeadCellClass()}>Consorciado</th>
                    <th className={tableHeadCellClass()}>Administradora</th>
                    <th className={tableHeadCellClass()}>Status</th>
                    {modo === "inconsistencia" ? (
                      <th className={tableHeadCellClass()}>Inconsistência</th>
                    ) : null}
                    {modo === "pos-venda" ? (
                      <th className={tableHeadCellClass()}>Pós-venda</th>
                    ) : null}
                    <th className={tableHeadCellClass()}>Equipe</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                    <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((v, index) => (
                    <tr
                      key={v.id}
                      className={`${tableRowClass(index)} cursor-pointer hover:bg-muted/50`}
                      onClick={() => openDrawer(v)}
                    >
                      <td className={`${tableCellClass()} font-medium text-foreground`}>
                        {v.numeroContrato}
                      </td>
                      <td className={tableCellClass()}>
                        {v.grupo} / {v.cota}
                        <div className="text-xs text-muted-foreground">Venc. dia {v.dataVencimento}</div>
                      </td>
                      <td className={tableCellClass()}>{v.consorciado?.nome ?? "—"}</td>
                      <td className={tableCellClass()}>{v.administradora?.nome ?? "—"}</td>
                      <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                        {modo === "inadimplencia" ? (
                          <button
                            type="button"
                            onClick={() => openStatusEdit(v)}
                            className="rounded-md text-left transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="Editar status"
                          >
                            <StatusBadge status={v.statusOperacional} />
                          </button>
                        ) : (
                          <StatusBadge status={v.statusOperacional} />
                        )}
                      </td>
                      {modo === "inconsistencia" ? (
                        <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                          <InconsistenciaBadge status={v.statusInconsistencia} />
                        </td>
                      ) : null}
                      {modo === "pos-venda" ? (
                        <td className={tableCellClass()} onClick={(e) => e.stopPropagation()}>
                          <PosVendaBadge status={v.statusPosVenda} />
                        </td>
                      ) : null}
                      <td className={tableCellClass()}>{v.equipe?.nome ?? "—"}</td>
                      <td className={`${tableCellClass()} tabular-nums`}>
                        {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                      </td>
                      <td
                        className={`${tableCellClass()} pr-0 text-right`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {(modo === "inadimplencia" || modo === "inconsistencia") && (
                            <WhatsAppButton
                              telefone={v.consorciado?.telefone}
                              nomeCliente={v.consorciado?.nome ?? ""}
                              numeroContrato={v.numeroContrato}
                              statusOperacional={v.statusOperacional}
                              vendaId={v.id}
                            />
                          )}
                          {modo === "inadimplencia" ? (
                            <button
                              type="button"
                              onClick={() => openStatusEdit(v)}
                              className={secondaryActionClass()}
                            >
                              Editar Status
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openDrawer(v)}
                            className={secondaryActionClass()}
                          >
                            Timeline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isPaginated ? (
              <PaginatedListFooter
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={() => void loadMore()}
                columns={6}
                skeletonRows={4}
              />
            ) : null}
          </>
        )}
      </DataListPanel>

      <VendaAtendimentoDrawer
        venda={selectedVenda}
        open={drawerOpen}
        onClose={closeDrawer}
        showInconsistenciaControls={modo === "inconsistencia"}
        showPosVendaControls={modo === "pos-venda"}
        defaultTipoRegistro={defaultTipo}
        onPosVendaCompleted={modo === "pos-venda" ? onPosVendaCompleted : undefined}
      />

      {modo === "inadimplencia" && statusEditVenda ? (
        <StatusOperacionalQuickEditModal
          open
          vendaId={statusEditVenda.id}
          numeroContrato={statusEditVenda.numeroContrato}
          consorciadoNome={statusEditVenda.consorciado?.nome ?? ""}
          statusAtual={statusEditVenda.statusOperacional}
          onClose={closeStatusEdit}
          onSuccess={onStatusOperacionalUpdated}
        />
      ) : null}
    </>
  );
}

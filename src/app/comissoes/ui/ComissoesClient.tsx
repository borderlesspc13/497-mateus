"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  liberarExtratoAction,
  listRepassesMapaPagamento,
  marcarExtratoPagoAction,
  marcarExtratoRecebidoAction,
  marcarRepassePagoAction,
  marcarRepassesPagosEmLoteAction,
  sincronizarExtratos,
} from "@/actions/comissoes";
import { ExportButton } from "@/components/export/ExportButton";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExtratoStatusBadge } from "@/components/ui/ExtratoStatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  dataTableClass,
  desktopTableClass,
  formControlClass,
  kpiGridClass,
  mobileListCardClass,
  mobileListClass,
  primaryActionClass,
  rowActionsClass,
  secondaryActionClass,
  tableCellClass,
  tableColFromClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import {
  COMISSOES_EXPORT_COLUMNS,
  REPASSES_EXPORT_COLUMNS,
} from "@/lib/export/columns/comissoes";
import { PAPEL_REPASSE_LABELS } from "@/lib/comissoes/regras-repasse";
import type { ExtratoRow, ExtratoStatus, PapelRepasse, RepasseRow } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type TabId = "extratos" | "mapa";

type ComissoesClientProps = {
  initialItems: ExtratoRow[];
  initialRepasses: RepasseRow[];
};

function RepasseStatusBadge({ status }: { status: RepasseRow["status"] }) {
  if (status === "PAGO") {
    return (
      <span className="inline-flex h-7 items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
        Pago
      </span>
    );
  }
  if (status === "PREVISTO") {
    return (
      <span className="inline-flex h-7 items-center rounded-full border border-border bg-muted/60 px-3 text-xs font-semibold text-muted-foreground">
        Previsto
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
      A pagar
    </span>
  );
}

export default function ComissoesClient({
  initialItems,
  initialRepasses,
}: ComissoesClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("extratos");
  const [items, setItems] = useState(initialItems);
  const [repasses, setRepasses] = useState(initialRepasses);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | ExtratoStatus>("");
  const [incluirPagos, setIncluirPagos] = useState(false);
  const [statusRepasseFilter, setStatusRepasseFilter] = useState<"" | RepasseRow["status"]>("");
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [batchPaying, setBatchPaying] = useState(false);
  const [loadingMapa, setLoadingMapa] = useState(false);
  const [selectedRepasseIds, setSelectedRepasseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setRepasses(initialRepasses);
  }, [initialRepasses]);

  useEffect(() => {
    if (tab !== "mapa") return;
    let alive = true;
    setLoadingMapa(true);
    void listRepassesMapaPagamento({ incluirPagos: true })
      .then((rows) => {
        if (!alive) return;
        setRepasses(rows);
        setSelectedRepasseIds(new Set());
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar mapa de pagamento.");
      })
      .finally(() => {
        if (!alive) return;
        setLoadingMapa(false);
      });
    return () => {
      alive = false;
    };
  }, [tab, initialRepasses]);

  const filteredExtratos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${row.numeroContrato} ${row.vendaTitulo} ${row.consorciadoNome ?? ""} ${row.planoNome} ${row.vendedorNome ?? ""} ${row.parcelaLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, statusFilter]);

  const filteredRepasses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repasses.filter((row) => {
      if (!incluirPagos && row.status === "PAGO") return false;
      if (statusRepasseFilter && row.status !== statusRepasseFilter) return false;
      if (!q) return true;
      const hay = `${row.numeroContrato} ${row.beneficiarioNome} ${row.planoNome} ${row.papel} ${row.parcelaLabel} ${row.consorciadoNome ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [repasses, query, statusRepasseFilter, incluirPagos]);

  const pendenteRepasseIds = useMemo(
    () => filteredRepasses.filter((r) => r.status === "PENDENTE").map((r) => r.id),
    [filteredRepasses],
  );

  const totaisExtratos = useMemo(() => {
    const pendente = filteredExtratos
      .filter((r) => r.status === "PENDENTE")
      .reduce((s, r) => s + r.valorCentavos, 0);
    const recebido = filteredExtratos
      .filter((r) => r.status === "RECEBIDO")
      .reduce((s, r) => s + r.valorCentavos, 0);
    const liberado = filteredExtratos
      .filter((r) => r.status === "LIBERADO")
      .reduce((s, r) => s + r.valorCentavos, 0);
    const pago = filteredExtratos
      .filter((r) => r.status === "PAGO")
      .reduce((s, r) => s + r.valorCentavos, 0);
    return { pendente, recebido, liberado, pago };
  }, [filteredExtratos]);

  const totaisRepasses = useMemo(() => {
    const previsto = filteredRepasses
      .filter((r) => r.status === "PREVISTO")
      .reduce((s, r) => s + r.valorCentavos, 0);
    const pendente = filteredRepasses
      .filter((r) => r.status === "PENDENTE")
      .reduce((s, r) => s + r.valorCentavos, 0);
    const pago = filteredRepasses
      .filter((r) => r.status === "PAGO")
      .reduce((s, r) => s + r.valorCentavos, 0);
    return { previsto, pendente, pago };
  }, [filteredRepasses]);

  const allPendentesSelected =
    pendenteRepasseIds.length > 0 &&
    pendenteRepasseIds.every((id) => selectedRepasseIds.has(id));

  async function onSync() {
    setError(null);
    setSyncing(true);
    try {
      await sincronizarExtratos();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao sincronizar extratos.");
    } finally {
      setSyncing(false);
    }
  }

  async function onMarcarRecebido(id: string) {
    setError(null);
    setActionId(id);
    try {
      await marcarExtratoRecebidoAction(id);
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "RECEBIDO" as const } : r)),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao marcar como recebido.");
    } finally {
      setActionId(null);
    }
  }

  async function onLiberar(id: string) {
    setError(null);
    setActionId(id);
    try {
      await liberarExtratoAction(id);
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "LIBERADO" as const } : r)),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao liberar extrato.");
    } finally {
      setActionId(null);
    }
  }

  async function onMarcarPago(id: string) {
    setError(null);
    setActionId(id);
    try {
      await marcarExtratoPagoAction(id);
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "PAGO" as const } : r)),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao marcar extrato como pago.");
    } finally {
      setActionId(null);
    }
  }

  async function onMarcarRepassePago(id: string) {
    setError(null);
    setActionId(id);
    try {
      await marcarRepassePagoAction(id);
      setRepasses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "PAGO" as const } : r)),
      );
      setSelectedRepasseIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao marcar repasse como pago.");
    } finally {
      setActionId(null);
    }
  }

  async function onMarcarRepassesLote() {
    const ids = [...selectedRepasseIds].filter((id) => pendenteRepasseIds.includes(id));
    if (ids.length === 0) return;
    setError(null);
    setBatchPaying(true);
    try {
      const result = await marcarRepassesPagosEmLoteAction(ids);
      setRepasses((prev) =>
        prev.map((r) => (ids.includes(r.id) ? { ...r, status: "PAGO" as const } : r)),
      );
      setSelectedRepasseIds(new Set());
      if (result.errors.length > 0) {
        setError(
          `${result.updated} pago(s). ${result.errors.length} falha(s): ${result.errors[0]}`,
        );
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao pagar repasses em lote.");
    } finally {
      setBatchPaying(false);
    }
  }

  function toggleRepasseSelection(id: string) {
    setSelectedRepasseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPendentes() {
    if (allPendentesSelected) {
      setSelectedRepasseIds(new Set());
      return;
    }
    setSelectedRepasseIds(new Set(pendenteRepasseIds));
  }

  return (
    <DataListPanel
      toolbar={
        <>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <button
              type="button"
              onClick={() => setTab("extratos")}
              className={
                tab === "extratos"
                  ? "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                  : secondaryActionClass()
              }
            >
              Extratos
            </button>
            <button
              type="button"
              onClick={() => setTab("mapa")}
              className={
                tab === "mapa"
                  ? "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                  : secondaryActionClass()
              }
            >
              Mapa
            </button>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === "extratos"
                ? "Buscar por contrato, consorciado, plano..."
                : "Buscar por contrato, beneficiário, papel..."
            }
            className={formControlClass("lg")}
          />
          {tab === "extratos" ? (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className={formControlClass("sm")}
              >
                <option value="">Todos status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="RECEBIDO">Recebido</option>
                <option value="LIBERADO">Liberado</option>
                <option value="PAGO">Pago</option>
              </select>
              <button
                type="button"
                onClick={() => void onSync()}
                disabled={syncing}
                className={secondaryActionClass()}
              >
                {syncing ? "Sincronizando..." : "Recalcular extratos"}
              </button>
              <ExportButton
                fileNameBase="comissoes"
                sheetName="Comissões"
                rows={filteredExtratos}
                columns={COMISSOES_EXPORT_COLUMNS}
              />
            </>
          ) : (
            <>
              <select
                value={statusRepasseFilter}
                onChange={(e) =>
                  setStatusRepasseFilter(e.target.value as typeof statusRepasseFilter)
                }
                className={formControlClass("sm")}
              >
                <option value="">Todos status</option>
                <option value="PREVISTO">Previsto</option>
                <option value="PENDENTE">A pagar</option>
                <option value="PAGO">Pago</option>
              </select>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={incluirPagos}
                  onChange={(e) => setIncluirPagos(e.target.checked)}
                  className="rounded border-border"
                />
                Já pago
              </label>
              <ExportButton
                fileNameBase="mapa-pagamento"
                sheetName="Repasses"
                rows={filteredRepasses}
                columns={REPASSES_EXPORT_COLUMNS}
              />
              {selectedRepasseIds.size > 0 ? (
                <button
                  type="button"
                  onClick={() => void onMarcarRepassesLote()}
                  disabled={batchPaying}
                  className={primaryActionClass()}
                >
                  {batchPaying
                    ? "Pagando..."
                    : `Pagar selecionados (${selectedRepasseIds.size})`}
                </button>
              ) : null}
            </>
          )}
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
      {tab === "extratos" ? (
        <>
          <div className={`mb-6 ${kpiGridClass(4)} px-4 sm:px-6 lg:px-8`}>
            {(
              [
                ["Pendente", totaisExtratos.pendente, "border-border bg-muted/50"],
                ["Recebido", totaisExtratos.recebido, "border-violet-500/30 bg-violet-500/10"],
                ["Liberado", totaisExtratos.liberado, "border-blue-500/30 bg-blue-500/10"],
                ["Pago", totaisExtratos.pago, "border-emerald-500/30 bg-emerald-500/10"],
              ] as const
            ).map(([label, centavos, cardClass]) => (
              <div key={label} className={`rounded-2xl border p-3 sm:p-4 ${cardClass}`}>
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-semibold tabular-nums text-foreground sm:text-lg">
                  {formatMoneyPtBrFromCentavos(centavos)}
                </div>
              </div>
            ))}
          </div>

          {syncing ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <TableSkeleton rows={6} columns={8} />
            </div>
          ) : filteredExtratos.length === 0 ? (
            <EmptyState
              title={items.length === 0 ? "Nenhum extrato gerado" : "Nenhum resultado encontrado"}
              description="Os extratos são gerados automaticamente ao registrar vendas ativas com plano e regras financeiras. Remessas com PARCELA também marcam recebimento em /importacao."
            />
          ) : (
            <>
            <div className={mobileListClass()}>
              {filteredExtratos.map((row) => (
                <article key={row.id} className={mobileListCardClass()}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/vendas/${row.vendaId}`}
                        className="font-semibold text-foreground underline-offset-2 hover:underline"
                      >
                        {row.numeroContrato}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {row.consorciadoNome ?? "—"} · {row.parcelaLabel}
                      </p>
                    </div>
                    <ExtratoStatusBadge status={row.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      <p>{row.planoNome}</p>
                      <p className="mt-1 tabular-nums font-semibold text-foreground">
                        {formatMoneyPtBrFromCentavos(row.valorCentavos)}
                      </p>
                    </div>
                    <div className={rowActionsClass()}>
                      {row.tipo !== "ESTORNO" && row.status === "PENDENTE" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void onMarcarRecebido(row.id)}
                            disabled={actionId === row.id}
                            className={secondaryActionClass()}
                          >
                            {actionId === row.id ? "..." : "Recebido"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void onLiberar(row.id)}
                            disabled={actionId === row.id}
                            className={secondaryActionClass()}
                          >
                            {actionId === row.id ? "..." : "Liberar"}
                          </button>
                        </>
                      ) : null}
                      {row.status === "RECEBIDO" ? (
                        <span className="text-xs text-muted-foreground">Liberado p/ mapa</span>
                      ) : null}
                      {row.status === "LIBERADO" ? (
                        <button
                          type="button"
                          onClick={() => void onMarcarPago(row.id)}
                          disabled={actionId === row.id}
                          className={secondaryActionClass()}
                        >
                          {actionId === row.id ? "..." : "Marcar pago"}
                        </button>
                      ) : null}
                      {row.status === "PAGO" ? (
                        <span className="text-xs text-muted-foreground">Concluído</span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className={`${desktopTableClass()} ${tableWrapClass()}`}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Contrato</th>
                    <th className={tableHeadCellClass()}>Consorciado</th>
                    <th className={`${tableHeadCellClass()} ${tableColFromClass("lg")}`}>Plano</th>
                    <th className={`${tableHeadCellClass()} ${tableColFromClass("xl")}`}>
                      Vendedor
                    </th>
                    <th className={tableHeadCellClass()}>Parcela</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                    <th className={tableHeadCellClass()}>Status</th>
                    <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExtratos.map((row, index) => (
                    <tr key={row.id} className={tableRowClass(index)}>
                      <td className={`${tableCellClass()} font-medium text-foreground`}>
                        <Link
                          href={`/vendas/${row.vendaId}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {row.numeroContrato}
                        </Link>
                      </td>
                      <td className={tableCellClass()}>{row.consorciadoNome ?? "—"}</td>
                      <td className={`${tableCellClass()} ${tableColFromClass("lg")}`}>
                        {row.planoNome}
                      </td>
                      <td className={`${tableCellClass()} ${tableColFromClass("xl")}`}>
                        {row.vendedorNome ?? "—"}
                      </td>
                      <td className={tableCellClass()}>{row.parcelaLabel}</td>
                      <td className={`${tableCellClass()} tabular-nums font-medium`}>
                        {formatMoneyPtBrFromCentavos(row.valorCentavos)}
                      </td>
                      <td className={tableCellClass()}>
                        <ExtratoStatusBadge status={row.status} />
                      </td>
                      <td className={`${tableCellClass()} pr-0 text-right`}>
                        <div className={rowActionsClass()}>
                          {row.tipo !== "ESTORNO" && row.status === "PENDENTE" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void onMarcarRecebido(row.id)}
                                disabled={actionId === row.id}
                                className={secondaryActionClass()}
                              >
                                {actionId === row.id ? "..." : "Recebido"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void onLiberar(row.id)}
                                disabled={actionId === row.id}
                                className={secondaryActionClass()}
                              >
                                {actionId === row.id ? "..." : "Liberar"}
                              </button>
                            </>
                          ) : null}
                          {row.status === "RECEBIDO" ? (
                            <span className="text-xs text-muted-foreground">Liberado p/ mapa</span>
                          ) : null}
                          {row.status === "LIBERADO" ? (
                            <button
                              type="button"
                              onClick={() => void onMarcarPago(row.id)}
                              disabled={actionId === row.id}
                              className={secondaryActionClass()}
                            >
                              {actionId === row.id ? "..." : "Marcar pago"}
                            </button>
                          ) : null}
                          {row.status === "PAGO" ? (
                            <span className="text-xs text-muted-foreground">Concluído</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </>
      ) : loadingMapa ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <TableSkeleton rows={6} columns={8} />
        </div>
      ) : (
        <>
          <div className={`mb-6 ${kpiGridClass(3)} px-4 sm:px-6 lg:px-8`}>
            <div className="rounded-2xl border border-border bg-muted/50 p-3 sm:p-4">
              <div className="text-xs font-medium text-muted-foreground">Previsto</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-foreground sm:text-lg">
                {formatMoneyPtBrFromCentavos(totaisRepasses.previsto)}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-4">
              <div className="text-xs font-medium text-muted-foreground">A pagar</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-foreground sm:text-lg">
                {formatMoneyPtBrFromCentavos(totaisRepasses.pendente)}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
              <div className="text-xs font-medium text-muted-foreground">Pago</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-foreground sm:text-lg">
                {formatMoneyPtBrFromCentavos(totaisRepasses.pago)}
              </div>
            </div>
          </div>

          {filteredRepasses.length === 0 ? (
            <EmptyState
              title="Nenhum repasse no mapa"
              description="Ao registrar uma venda ativa, os repasses previstos (vendedor, supervisor e diretor) aparecem aqui. Quando a administradora confirma o recebimento, o status muda para A pagar."
            />
          ) : (
            <>
            <div className={mobileListClass()}>
              {filteredRepasses.map((row) => (
                <article key={row.id} className={mobileListCardClass()}>
                  <div className="flex items-start gap-3">
                    {row.status === "PENDENTE" ? (
                      <input
                        type="checkbox"
                        checked={selectedRepasseIds.has(row.id)}
                        onChange={() => toggleRepasseSelection(row.id)}
                        className="mt-1 rounded border-border"
                        aria-label={`Selecionar ${row.beneficiarioNome}`}
                      />
                    ) : (
                      <span className="mt-1 size-4 shrink-0" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{row.beneficiarioNome}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {row.numeroContrato} · {PAPEL_REPASSE_LABELS[row.papel as PapelRepasse]}
                          </p>
                        </div>
                        <RepasseStatusBadge status={row.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                          <p>
                            {row.parcelaLabel} · {row.percentualPapel.toLocaleString("pt-BR")}%
                          </p>
                          <p className="mt-1 tabular-nums font-semibold text-foreground">
                            {formatMoneyPtBrFromCentavos(row.valorCentavos)}
                          </p>
                        </div>
                        {row.status === "PENDENTE" ? (
                          <button
                            type="button"
                            onClick={() => void onMarcarRepassePago(row.id)}
                            disabled={actionId === row.id}
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                          >
                            {actionId === row.id ? "..." : "Marcar pago"}
                          </button>
                        ) : row.status === "PREVISTO" ? (
                          <span className="text-xs text-muted-foreground">Aguarda recebimento</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Concluído</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className={`${desktopTableClass()} ${tableWrapClass()}`}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>
                      <input
                        type="checkbox"
                        checked={allPendentesSelected}
                        onChange={toggleSelectAllPendentes}
                        disabled={pendenteRepasseIds.length === 0}
                        className="rounded border-border"
                        aria-label="Selecionar todos pendentes"
                      />
                    </th>
                    <th className={tableHeadCellClass()}>Contrato</th>
                    <th className={tableHeadCellClass()}>Beneficiário</th>
                    <th className={tableHeadCellClass()}>Papel</th>
                    <th className={`${tableHeadCellClass()} ${tableColFromClass("lg")}`}>Plano</th>
                    <th className={tableHeadCellClass()}>Parcela</th>
                    <th className={`${tableHeadCellClass()} ${tableColFromClass("xl")}`}>%</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                    <th className={tableHeadCellClass()}>Status</th>
                    <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepasses.map((row, index) => (
                    <tr key={row.id} className={tableRowClass(index)}>
                      <td className={tableCellClass()}>
                        {row.status === "PENDENTE" ? (
                          <input
                            type="checkbox"
                            checked={selectedRepasseIds.has(row.id)}
                            onChange={() => toggleRepasseSelection(row.id)}
                            className="rounded border-border"
                            aria-label={`Selecionar ${row.beneficiarioNome}`}
                          />
                        ) : null}
                      </td>
                      <td className={`${tableCellClass()} font-medium text-foreground`}>
                        {row.numeroContrato}
                      </td>
                      <td className={tableCellClass()}>{row.beneficiarioNome}</td>
                      <td className={tableCellClass()}>
                        {PAPEL_REPASSE_LABELS[row.papel as PapelRepasse]}
                      </td>
                      <td className={`${tableCellClass()} ${tableColFromClass("lg")}`}>
                        {row.planoNome}
                      </td>
                      <td className={tableCellClass()}>{row.parcelaLabel}</td>
                      <td className={`${tableCellClass()} tabular-nums ${tableColFromClass("xl")}`}>
                        {row.percentualPapel.toLocaleString("pt-BR")}%
                      </td>
                      <td className={`${tableCellClass()} tabular-nums font-medium`}>
                        {formatMoneyPtBrFromCentavos(row.valorCentavos)}
                      </td>
                      <td className={tableCellClass()}>
                        <RepasseStatusBadge status={row.status} />
                      </td>
                      <td className={`${tableCellClass()} pr-0 text-right`}>
                        {row.status === "PENDENTE" ? (
                          <button
                            type="button"
                            onClick={() => void onMarcarRepassePago(row.id)}
                            disabled={actionId === row.id}
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                          >
                            {actionId === row.id ? "..." : "Marcar pago"}
                          </button>
                        ) : row.status === "PREVISTO" ? (
                          <span className="text-xs text-muted-foreground">Aguarda recebimento</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Concluído</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </>
      )}
    </DataListPanel>
  );
}

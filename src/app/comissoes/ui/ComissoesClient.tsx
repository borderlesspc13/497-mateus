"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  listRepassesMapaPagamento,
  marcarExtratoRecebidoAction,
  marcarRepassePagoAction,
  sincronizarExtratos,
} from "@/actions/comissoes";
import { ExportButton } from "@/components/export/ExportButton";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExtratoStatusBadge } from "@/components/ui/ExtratoStatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  dataTableClass,
  formControlClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import { COMISSOES_EXPORT_COLUMNS } from "@/lib/export/columns/comissoes";
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
      <span className="inline-flex h-7 items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-800">
        Pago
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-semibold text-amber-800">
      Pendente
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
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [loadingMapa, setLoadingMapa] = useState(false);

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
    void listRepassesMapaPagamento({ incluirPagos })
      .then((rows) => {
        if (!alive) return;
        setRepasses(rows);
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
  }, [tab, incluirPagos, initialRepasses]);

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
      if (!q) return true;
      const hay = `${row.numeroContrato} ${row.beneficiarioNome} ${row.planoNome} ${row.papel} ${row.parcelaLabel} ${row.consorciadoNome ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [repasses, query]);

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
    const pendente = filteredRepasses
      .filter((r) => r.status === "PENDENTE")
      .reduce((s, r) => s + r.valorCentavos, 0);
    const pago = filteredRepasses
      .filter((r) => r.status === "PAGO")
      .reduce((s, r) => s + r.valorCentavos, 0);
    return { pendente, pago };
  }, [filteredRepasses]);

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

  async function onMarcarRepassePago(id: string) {
    setError(null);
    setActionId(id);
    try {
      await marcarRepassePagoAction(id);
      setRepasses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "PAGO" as const } : r)),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao marcar repasse como pago.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <DataListPanel
      toolbar={
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("extratos")}
              className={
                tab === "extratos"
                  ? "inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white"
                  : secondaryActionClass()
              }
            >
              Extratos administradora
            </button>
            <button
              type="button"
              onClick={() => setTab("mapa")}
              className={
                tab === "mapa"
                  ? "inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white"
                  : secondaryActionClass()
              }
            >
              Mapa de pagamento
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
            <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600">
              <input
                type="checkbox"
                checked={incluirPagos}
                onChange={(e) => setIncluirPagos(e.target.checked)}
                className="rounded border-zinc-300"
              />
              Já pago
            </label>
          )}
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
      {tab === "extratos" ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            {(
              [
                ["Pendente", totaisExtratos.pendente, "border-zinc-200 bg-zinc-50"],
                ["Recebido", totaisExtratos.recebido, "border-violet-200 bg-violet-50/50"],
                ["Liberado", totaisExtratos.liberado, "border-blue-200 bg-blue-50/50"],
                ["Pago", totaisExtratos.pago, "border-emerald-200 bg-emerald-50/50"],
              ] as const
            ).map(([label, centavos, cardClass]) => (
              <div key={label} className={`rounded-2xl border p-4 ${cardClass}`}>
                <div className="text-xs font-medium text-zinc-500">{label}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                  {formatMoneyPtBrFromCentavos(centavos)}
                </div>
              </div>
            ))}
          </div>

          {syncing ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <TableSkeleton rows={6} columns={8} />
            </div>
          ) : filteredExtratos.length === 0 ? (
            <EmptyState
              title={items.length === 0 ? "Nenhum extrato gerado" : "Nenhum resultado encontrado"}
              description="Os extratos são gerados automaticamente ao registrar vendas ativas com plano e regras financeiras."
            />
          ) : (
            <div className={tableWrapClass()}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Contrato</th>
                    <th className={tableHeadCellClass()}>Consorciado</th>
                    <th className={tableHeadCellClass()}>Plano</th>
                    <th className={tableHeadCellClass()}>Vendedor</th>
                    <th className={tableHeadCellClass()}>Parcela</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                    <th className={tableHeadCellClass()}>Status</th>
                    <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExtratos.map((row, index) => (
                    <tr key={row.id} className={tableRowClass(index)}>
                      <td className={`${tableCellClass()} font-medium text-zinc-900`}>
                        <Link
                          href={`/vendas/${row.vendaId}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {row.numeroContrato}
                        </Link>
                      </td>
                      <td className={tableCellClass()}>{row.consorciadoNome ?? "—"}</td>
                      <td className={tableCellClass()}>{row.planoNome}</td>
                      <td className={tableCellClass()}>{row.vendedorNome ?? "—"}</td>
                      <td className={tableCellClass()}>{row.parcelaLabel}</td>
                      <td className={`${tableCellClass()} tabular-nums font-medium`}>
                        {formatMoneyPtBrFromCentavos(row.valorCentavos)}
                      </td>
                      <td className={tableCellClass()}>
                        <ExtratoStatusBadge status={row.status} />
                      </td>
                      <td className={`${tableCellClass()} pr-0 text-right`}>
                        {row.tipo !== "ESTORNO" && row.status === "PENDENTE" ? (
                          <button
                            type="button"
                            onClick={() => void onMarcarRecebido(row.id)}
                            disabled={actionId === row.id}
                            className={secondaryActionClass()}
                          >
                            {actionId === row.id ? "..." : "Marcar recebido"}
                          </button>
                        ) : null}
                        {row.status === "RECEBIDO" ? (
                          <span className="text-xs text-zinc-400">Repasse gerado</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : loadingMapa ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <TableSkeleton rows={6} columns={8} />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="text-xs font-medium text-zinc-500">Repasse pendente</div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                {formatMoneyPtBrFromCentavos(totaisRepasses.pendente)}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="text-xs font-medium text-zinc-500">Repasse pago</div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                {formatMoneyPtBrFromCentavos(totaisRepasses.pago)}
              </div>
            </div>
          </div>

          {filteredRepasses.length === 0 ? (
            <EmptyState
              title="Nenhum repasse no mapa"
              description="Marque extratos como recebidos da administradora para gerar as linhas de repasse interno (vendedor, supervisor e diretor)."
            />
          ) : (
            <div className={tableWrapClass()}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Contrato</th>
                    <th className={tableHeadCellClass()}>Beneficiário</th>
                    <th className={tableHeadCellClass()}>Papel</th>
                    <th className={tableHeadCellClass()}>Plano</th>
                    <th className={tableHeadCellClass()}>Parcela</th>
                    <th className={tableHeadCellClass()}>%</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                    <th className={tableHeadCellClass()}>Status</th>
                    <th className={`${tableHeadCellClass()} pr-0 text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepasses.map((row, index) => (
                    <tr key={row.id} className={tableRowClass(index)}>
                      <td className={`${tableCellClass()} font-medium text-zinc-900`}>
                        {row.numeroContrato}
                      </td>
                      <td className={tableCellClass()}>{row.beneficiarioNome}</td>
                      <td className={tableCellClass()}>
                        {PAPEL_REPASSE_LABELS[row.papel as PapelRepasse]}
                      </td>
                      <td className={tableCellClass()}>{row.planoNome}</td>
                      <td className={tableCellClass()}>{row.parcelaLabel}</td>
                      <td className={`${tableCellClass()} tabular-nums`}>
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
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                          >
                            {actionId === row.id ? "..." : "Marcar pago"}
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-400">Concluído</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DataListPanel>
  );
}

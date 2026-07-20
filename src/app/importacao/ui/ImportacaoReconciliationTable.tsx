"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formControlClass, secondaryActionClass } from "@/components/ui/list-panel-classes";
import { countPendingReconciliation } from "@/lib/importacao/reconciliation";
import type {
  ImportReconciliationItem,
  ImportReconciliationResolution,
  ImportReconciliationSummary,
} from "@/lib/importacao/types";

export type ImportacaoReconciliationTableProps = {
  reconciliation: ImportReconciliationSummary;
  resolutions: Record<string, ImportReconciliationResolution | undefined>;
  onResolveAtivo: (item: ImportReconciliationItem) => void;
  onResolveCancelado: (item: ImportReconciliationItem, parcelasPagas: number) => void;
  onClearResolution: (numeroContrato: string) => void;
};

export function ImportacaoReconciliationTable({
  reconciliation,
  resolutions,
  onResolveAtivo,
  onResolveCancelado,
  onClearResolution,
}: ImportacaoReconciliationTableProps) {
  const pendingCount = useMemo(
    () => countPendingReconciliation(reconciliation.missingFromSpreadsheet, resolutions),
    [reconciliation.missingFromSpreadsheet, resolutions],
  );

  const resolvedCount = reconciliation.totalDivergentes - pendingCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-foreground/80">
          <span className="font-semibold text-foreground">
            {reconciliation.totalInadimplentesNoSistema}
          </span>{" "}
          inadimplente(s) no sistema ·{" "}
          <span className="font-semibold text-foreground">
            {reconciliation.totalInadimplentesCobertosNaPlanilha}
          </span>{" "}
          na planilha ·{" "}
          <span className="font-semibold text-amber-800 dark:text-amber-300">
            {reconciliation.totalDivergentes}
          </span>{" "}
          órfão(s)
        </p>
        <p
          className={[
            "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            pendingCount > 0
              ? "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200"
              : "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
          ].join(" ")}
        >
          {pendingCount > 0
            ? `${resolvedCount} de ${reconciliation.totalDivergentes} definido(s)`
            : "Todos definidos"}
        </p>
      </div>

      <ul className="space-y-4">
        {reconciliation.missingFromSpreadsheet.map((item) => {
          const resolution = resolutions[item.numeroContrato];
          return (
            <ReconciliationCard
              key={item.numeroContrato}
              item={item}
              resolution={resolution}
              onResolveAtivo={() => onResolveAtivo(item)}
              onResolveCancelado={(parcelasPagas) => onResolveCancelado(item, parcelasPagas)}
              onClearResolution={() => onClearResolution(item.numeroContrato)}
            />
          );
        })}
      </ul>
    </div>
  );
}

function ReconciliationCard({
  item,
  resolution,
  onResolveAtivo,
  onResolveCancelado,
  onClearResolution,
}: {
  item: ImportReconciliationItem;
  resolution: ImportReconciliationResolution | undefined;
  onResolveAtivo: () => void;
  onResolveCancelado: (parcelasPagas: number) => void;
  onClearResolution: () => void;
}) {
  const isResolved = Boolean(resolution);
  const isCancelado = resolution?.statusOperacional === "CANCELADO";
  const isAtivo = resolution?.statusOperacional === "ATIVO";
  const cancelParcelasInvalid =
    isCancelado &&
    (resolution?.parcelasPagasCancelamento === undefined ||
      !Number.isInteger(resolution.parcelasPagasCancelamento) ||
      resolution.parcelasPagasCancelamento < 0);
  const isComplete = isResolved && !cancelParcelasInvalid;

  return (
    <li
      className={[
        "rounded-2xl border p-4 sm:p-5",
        isComplete
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="text-base font-semibold text-foreground">Contrato {item.numeroContrato}</p>
            <span className="text-sm text-muted-foreground">
              Grupo {item.grupo} · Cota {item.cota}
            </span>
          </div>
          <p className="text-sm text-foreground/80">{item.consorciadoNome ?? "Sem consorciado"}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status atual
            </span>
            <StatusBadge status="INADIMPLENTE" />
            {resolution ? (
              <>
                <span className="text-muted-foreground" aria-hidden>
                  →
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nova definição
                </span>
                <StatusBadge status={resolution.statusOperacional} />
                {isCancelado ? (
                  <span className="text-xs text-muted-foreground">
                    Parcelas pagas: {resolution.parcelasPagasCancelamento ?? "—"}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Pendente — escolha Ativo ou Cancelado
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:max-w-md lg:shrink-0">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <button
              type="button"
              className={[
                secondaryActionClass(),
                "h-10 w-full justify-center",
                isAtivo
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                  : "",
              ].join(" ")}
              onClick={onResolveAtivo}
            >
              Marcar como Ativo
            </button>
            {isResolved ? (
              <button
                type="button"
                className="h-10 px-3 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline sm:justify-self-end"
                onClick={onClearResolution}
              >
                Limpar
              </button>
            ) : (
              <span className="hidden sm:block" aria-hidden />
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Ou cancelar — informe as parcelas já pagas
            </p>
            <CanceladoAction
              key={`${item.numeroContrato}-${resolution?.parcelasPagasCancelamento ?? "empty"}`}
              selected={isCancelado}
              parcelasPagas={resolution?.parcelasPagasCancelamento}
              onConfirm={onResolveCancelado}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

function CanceladoAction({
  selected,
  parcelasPagas,
  onConfirm,
}: {
  selected: boolean;
  parcelasPagas?: number;
  onConfirm: (parcelasPagas: number) => void;
}) {
  const [parcelasInput, setParcelasInput] = useState(
    parcelasPagas !== undefined ? String(parcelasPagas) : "",
  );

  function confirmCancelado() {
    const value = Number.parseInt(parcelasInput, 10);
    if (!Number.isInteger(value) || value < 0) return;
    onConfirm(value);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Parcelas pagas no cancelamento</span>
        <input
          type="number"
          min={0}
          step={1}
          value={parcelasInput}
          placeholder="Ex.: 3"
          aria-label="Parcelas pagas no cancelamento"
          className={`${formControlClass()} h-10`}
          onChange={(event) => setParcelasInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            confirmCancelado();
          }}
        />
      </label>
      <button
        type="button"
        className={[
          secondaryActionClass(),
          "h-10 w-full justify-center sm:w-auto sm:min-w-[8.5rem]",
          selected
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "",
        ].join(" ")}
        onClick={confirmCancelado}
      >
        Cancelado
      </button>
    </div>
  );
}

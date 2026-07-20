"use client";

import { useEffect, useMemo } from "react";
import { primaryCtaClass } from "@/components/page-flow/button-classes";
import { secondaryActionClass } from "@/components/ui/list-panel-classes";
import { describeInadimplenciaGap } from "@/lib/importacao/inadimplencia-reconciliation";
import { isReconciliationComplete } from "@/lib/importacao/reconciliation";
import type {
  ImportReconciliationItem,
  ImportReconciliationResolution,
  ImportReconciliationSummary,
} from "@/lib/importacao/types";
import { ImportacaoReconciliationTable } from "./ImportacaoReconciliationTable";

type ImportacaoReconciliationModalProps = {
  open: boolean;
  reconciliation: ImportReconciliationSummary;
  resolutions: Record<string, ImportReconciliationResolution | undefined>;
  onResolveAtivo: (item: ImportReconciliationItem) => void;
  onResolveCancelado: (item: ImportReconciliationItem, parcelasPagas: number) => void;
  onClearResolution: (numeroContrato: string) => void;
  onContinue: () => void;
};

export function ImportacaoReconciliationModal({
  open,
  reconciliation,
  resolutions,
  onResolveAtivo,
  onResolveCancelado,
  onClearResolution,
  onContinue,
}: ImportacaoReconciliationModalProps) {
  const reconciliationComplete = useMemo(
    () => isReconciliationComplete(reconciliation.missingFromSpreadsheet, resolutions),
    [reconciliation.missingFromSpreadsheet, resolutions],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && reconciliationComplete) onContinue();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, reconciliationComplete, onContinue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6 lg:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reconciliation-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" aria-hidden />

      <div className="relative flex h-[min(94vh,56rem)] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card text-card-foreground shadow-2xl sm:rounded-2xl">
        <header className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-5 py-5 sm:px-8 sm:py-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Importação bloqueada — conciliação obrigatória
          </p>
          <h2
            id="reconciliation-modal-title"
            className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            Conciliação de diferenças
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {describeInadimplenciaGap(reconciliation)} Para cada contrato abaixo, escolha{" "}
            <span className="font-semibold text-foreground">Ativo</span> (pagamento regularizado) ou{" "}
            <span className="font-semibold text-foreground">Cancelado</span> (informe as parcelas
            pagas).
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          <ImportacaoReconciliationTable
            reconciliation={reconciliation}
            resolutions={resolutions}
            onResolveAtivo={onResolveAtivo}
            onResolveCancelado={onResolveCancelado}
            onClearResolution={onClearResolution}
          />
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-border bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
          <p className="max-w-xl text-sm text-muted-foreground">
            {reconciliationComplete
              ? "Conciliação concluída. Você pode liberar a importação e confirmar o lote."
              : `Defina o status de todos os ${reconciliation.totalDivergentes} contrato(s) órfão(s) para continuar.`}
          </p>
          <button
            type="button"
            className={[
              reconciliationComplete ? primaryCtaClass() : secondaryActionClass(),
              "w-full sm:w-auto sm:min-w-[14rem]",
            ].join(" ")}
            disabled={!reconciliationComplete}
            onClick={onContinue}
          >
            {reconciliationComplete ? "Liberar e continuar importação" : "Conciliação pendente"}
          </button>
        </footer>
      </div>
    </div>
  );
}

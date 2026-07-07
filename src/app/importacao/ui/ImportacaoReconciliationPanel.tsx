"use client";

import { AlertBanner } from "@/components/ui/AlertBanner";
import { describeInadimplenciaGap } from "@/lib/importacao/inadimplencia-reconciliation";
import type { ImportReconciliationSummary } from "@/lib/importacao/types";

type ImportacaoReconciliationPanelProps = {
  reconciliation: ImportReconciliationSummary;
  reconciliationGatePassed: boolean;
  onReopenConciliation?: () => void;
};

/** Banner inline quando não há órfãos, ou após o modal de conciliação ser concluído. */
export function ImportacaoReconciliationPanel({
  reconciliation,
  reconciliationGatePassed,
  onReopenConciliation,
}: ImportacaoReconciliationPanelProps) {
  if (reconciliation.requiresManualReconciliation && !reconciliationGatePassed) {
    return (
      <AlertBanner tone="warning" title="Conciliação de Diferenças pendente">
        A importação está bloqueada até você definir o status de{" "}
        {reconciliation.totalDivergentes} contrato(s) inadimplente(s) ausente(s) na planilha.
      </AlertBanner>
    );
  }

  if (reconciliation.requiresManualReconciliation && reconciliationGatePassed) {
    return (
      <AlertBanner tone="success" title="Conciliação de Diferenças concluída">
        <p>
          {reconciliation.totalDivergentes} contrato(s) órfão(s) foram definidos manualmente e serão
          atualizados junto com a planilha ao confirmar a importação.
        </p>
        {onReopenConciliation ? (
          <button
            type="button"
            className="mt-2 text-sm font-semibold underline-offset-2 hover:underline"
            onClick={onReopenConciliation}
          >
            Revisar definições
          </button>
        ) : null}
      </AlertBanner>
    );
  }

  return <AlertBanner tone="success">{describeInadimplenciaGap(reconciliation)}</AlertBanner>;
}

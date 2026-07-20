"use client";

import { useEffect, useState, useTransition } from "react";
import { updateVenda } from "@/actions/vendas";
import { primaryCtaClass } from "@/components/page-flow/button-classes";
import { formControlClass, secondaryActionClass } from "@/components/ui/list-panel-classes";
import { STATUS_OPERACIONAL_LABELS } from "@/lib/export/formatters";
import type { StatusOperacionalCota } from "@/lib/types/domain";

const STATUS_OPTIONS: StatusOperacionalCota[] = ["ATIVO", "INADIMPLENTE", "CANCELADO"];

type Props = {
  open: boolean;
  vendaId: string;
  numeroContrato: string;
  consorciadoNome: string;
  statusAtual: StatusOperacionalCota;
  onClose: () => void;
  onSuccess: (vendaId: string, novoStatus: StatusOperacionalCota) => void;
};

export function StatusOperacionalQuickEditModal({
  open,
  vendaId,
  numeroContrato,
  consorciadoNome,
  statusAtual,
  onClose,
  onSuccess,
}: Props) {
  const [novoStatus, setNovoStatus] = useState<StatusOperacionalCota>(statusAtual);
  const [parcelasPagas, setParcelasPagas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setNovoStatus(statusAtual);
    setParcelasPagas("");
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, statusAtual, onClose, isPending]);

  if (!open) return null;

  function handleConfirm() {
    if (novoStatus === statusAtual) {
      onClose();
      return;
    }

    let parcelasPagasCancelamento: number | undefined;
    if (novoStatus === "CANCELADO") {
      const parsed = Number.parseInt(parcelasPagas, 10);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setError("Informe quantas parcelas foram pagas (0 ou mais).");
        return;
      }
      parcelasPagasCancelamento = parsed;
    }

    setError(null);
    startTransition(async () => {
      try {
        await updateVenda(vendaId, {
          statusOperacional: novoStatus,
          ...(parcelasPagasCancelamento !== undefined
            ? { parcelasPagasCancelamento }
            : {}),
        });
        onSuccess(vendaId, novoStatus);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar status.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-operacional-quick-edit-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[1px]"
        aria-label="Fechar"
        onClick={() => {
          if (!isPending) onClose();
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2
          id="status-operacional-quick-edit-title"
          className="text-lg font-semibold text-foreground"
        >
          Alterar status operacional
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Contrato <span className="font-semibold text-foreground">{numeroContrato}</span>
          {consorciadoNome ? (
            <>
              {" "}
              · <span className="font-semibold text-foreground">{consorciadoNome}</span>
            </>
          ) : null}
          . Confirme o novo status antes de salvar.
        </p>

        <p className="mt-4 text-sm text-muted-foreground">
          Status atual:{" "}
          <span className="font-semibold text-foreground">
            {STATUS_OPERACIONAL_LABELS[statusAtual]}
          </span>
        </p>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Novo status</span>
          <select
            value={novoStatus}
            onChange={(e) => setNovoStatus(e.target.value as StatusOperacionalCota)}
            className={formControlClass()}
            disabled={isPending}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_OPERACIONAL_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        {novoStatus === "CANCELADO" && novoStatus !== statusAtual ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Parcelas pagas antes do cancelamento <span className="text-red-600">*</span>
            </span>
            <input
              type="number"
              min={0}
              step={1}
              value={parcelasPagas}
              onChange={(e) => setParcelasPagas(e.target.value)}
              className={formControlClass()}
              placeholder="Ex.: 2"
              disabled={isPending}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Necessário para calcular o estorno de comissão.
            </span>
          </label>
        ) : null}

        {novoStatus === "ATIVO" && statusAtual === "INADIMPLENTE" ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Ao confirmar, a cota sairá da listagem de inadimplentes.
          </p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={secondaryActionClass()}
            disabled={isPending}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={primaryCtaClass()}
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Salvando..." : "Confirmar alteração"}
          </button>
        </div>
      </div>
    </div>
  );
}

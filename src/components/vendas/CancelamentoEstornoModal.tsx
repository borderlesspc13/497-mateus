"use client";

import { useEffect, useState } from "react";
import { primaryCtaClass } from "@/components/page-flow/button-classes";
import { formControlClass, secondaryActionClass } from "@/components/ui/list-panel-classes";

type CancelamentoEstornoModalProps = {
  open: boolean;
  numeroContrato: string;
  saving?: boolean;
  onConfirm: (parcelasPagas: number) => void;
  onClose: () => void;
};

export function CancelamentoEstornoModal({
  open,
  numeroContrato,
  saving = false,
  onConfirm,
  onClose,
}: CancelamentoEstornoModalProps) {
  const [parcelasPagas, setParcelasPagas] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setParcelasPagas("");
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, saving]);

  if (!open) return null;

  function handleConfirm() {
    const parsed = Number.parseInt(parcelasPagas, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setError("Informe um número inteiro válido (0 ou mais).");
      return;
    }
    setError(null);
    onConfirm(parsed);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancelamento-estorno-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/45 backdrop-blur-[1px]"
        aria-label="Fechar"
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 id="cancelamento-estorno-title" className="text-lg font-semibold text-foreground">
          Cancelamento da venda
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          A venda <span className="font-semibold text-foreground">{numeroContrato}</span> será marcada como
          cancelada. Informe quantas parcelas foram pagas antes do cancelamento para calcular o
          estorno de comissão automaticamente.
        </p>

        <label className="mt-5 block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Quantas parcelas foram pagas antes do cancelamento?{" "}
            <span className="text-red-600">*</span>
          </span>
          <input
            type="number"
            min={0}
            step={1}
            value={parcelasPagas}
            onChange={(e) => setParcelasPagas(e.target.value)}
            className={formControlClass()}
            placeholder="Ex.: 2"
            disabled={saving}
            autoFocus
          />
        </label>

        {error ? (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={secondaryActionClass()}
            disabled={saving}
            onClick={onClose}
          >
            Voltar
          </button>
          <button
            type="button"
            className={primaryCtaClass()}
            disabled={saving}
            onClick={handleConfirm}
          >
            {saving ? "Processando..." : "Confirmar cancelamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

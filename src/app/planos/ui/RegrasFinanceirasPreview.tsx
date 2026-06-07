"use client";

import { useMemo } from "react";
import { panelClass } from "@/components/ui/list-panel-classes";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";
import {
  calcularDataLimiteEstorno,
  calcularParcelasComissao,
  calcularComissaoTotalCentavos,
} from "@/utils/financeiro";
import { parseRegrasFinanceirasForm, type RegrasFinanceirasFormState } from "./RegrasFinanceirasFields";

type RegrasFinanceirasPreviewProps = {
  form: RegrasFinanceirasFormState;
  valorCreditoCentavos: number | null;
};

export function RegrasFinanceirasPreview({
  form,
  valorCreditoCentavos,
}: RegrasFinanceirasPreviewProps) {
  const preview = useMemo(() => {
    const parsed = parseRegrasFinanceirasForm(form);
    if ("error" in parsed) return { error: parsed.error } as const;
    if (valorCreditoCentavos === null || valorCreditoCentavos <= 0) {
      return { error: "Informe o valor do crédito para simular a comissão." } as const;
    }

    const total = calcularComissaoTotalCentavos(
      valorCreditoCentavos,
      parsed.percentualComissao,
    );
    const parcelas = calcularParcelasComissao(valorCreditoCentavos, parsed);
    const exemploEstorno = calcularDataLimiteEstorno(
      new Date().toISOString(),
      parsed.diasParaEstorno,
    );

    return {
      total,
      parcelas,
      regras: parsed,
      exemploEstorno,
    } as const;
  }, [form, valorCreditoCentavos]);

  return (
    <div className={`${panelClass()} mt-6 border-dashed bg-zinc-50/80 p-5`}>
      <div className="text-sm font-medium text-zinc-900">Simulação do motor financeiro</div>
      <p className="mt-1 text-xs leading-5 text-zinc-500">
        Prévia dos cálculos com base no crédito informado. Valores em centavos internamente — sem
        arredondamento impreciso.
      </p>

      {"error" in preview ? (
        <p className="mt-4 text-sm text-zinc-500">{preview.error}</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Comissão total
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
                {formatMoneyPtBrFromCentavos(preview.total)}
              </div>
            </div>
            <div className="text-right text-xs text-zinc-500">
              {preview.regras.percentualComissao.toLocaleString("pt-BR")}% sobre{" "}
              {formatMoneyPtBrFromCentavos(valorCreditoCentavos!)}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {preview.parcelas.map((parcela) => (
              <div
                key={parcela.label}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {parcela.label}
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                  {formatMoneyPtBrFromCentavos(parcela.valorCentavos)}
                </div>
              </div>
            ))}
          </div>

          {preview.exemploEstorno ? (
            <p className="text-xs text-zinc-500">
              Prazo de estorno: {preview.regras.diasParaEstorno} dias — vendas canceladas dentro
              desse prazo removem extratos pendentes/liberados (ex.: limite hoje seria{" "}
              {preview.exemploEstorno.toLocaleDateString("pt-BR")}).
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

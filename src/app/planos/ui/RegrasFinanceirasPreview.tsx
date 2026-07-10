"use client";

import { useMemo } from "react";
import { panelClass } from "@/components/ui/list-panel-classes";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";
import {
  distribuicaoComissaoSchema,
  formatPercentualInput,
  parsePercentualInput,
  type DistribuicaoComissaoFormValues,
  type NivelDistribuicaoFormValues,
} from "@/lib/planos/distribuicao-comissao-schema";
import {
  calcularDataLimiteEstorno,
  calcularComissaoTotalCentavos,
} from "@/utils/financeiro";

type RegrasFinanceirasPreviewProps = {
  distribuicao: DistribuicaoComissaoFormValues;
  valorCreditoCentavos: number | null;
};

type NivelPreview = {
  key: string;
  label: string;
  percentualTotal: number;
  valorCentavos: number;
  parcelas: Array<{ label: string; percentual: number; valorCentavos: number }>;
};

function mapNivelPreview(
  key: string,
  label: string,
  nivel: NivelDistribuicaoFormValues,
  creditoCentavos: number,
): NivelPreview {
  const percentualTotal = parsePercentualInput(nivel.percentualTotal);
  const valorCentavos = calcularComissaoTotalCentavos(creditoCentavos, percentualTotal);

  return {
    key,
    label,
    percentualTotal,
    valorCentavos,
    parcelas: nivel.parcelas.map((parcela, index) => {
      const percentual = parsePercentualInput(parcela.percentual);
      return {
        label: `P${index + 1}`,
        percentual,
        valorCentavos: calcularComissaoTotalCentavos(creditoCentavos, percentual),
      };
    }),
  };
}

export function RegrasFinanceirasPreview({
  distribuicao,
  valorCreditoCentavos,
}: RegrasFinanceirasPreviewProps) {
  const preview = useMemo(() => {
    const parsed = distribuicaoComissaoSchema.safeParse(distribuicao);
    if (!parsed.success) {
      return { error: "Preencha a distribuição de comissões para simular os valores." } as const;
    }

    if (valorCreditoCentavos === null || valorCreditoCentavos <= 0) {
      return { error: "Informe o valor do crédito para simular a comissão." } as const;
    }

    const niveis: NivelPreview[] = [
      mapNivelPreview("empresa", "Empresa", parsed.data.empresa, valorCreditoCentavos),
      mapNivelPreview("vendedor", "Vendedor", parsed.data.vendedor, valorCreditoCentavos),
      mapNivelPreview("supervisor", "Supervisor", parsed.data.supervisor, valorCreditoCentavos),
      mapNivelPreview("diretor", "Diretor", parsed.data.diretor, valorCreditoCentavos),
    ];

    const totalDistribuidoCentavos = niveis.reduce(
      (acc, nivel) => acc + nivel.valorCentavos,
      0,
    );
    const percentualDistribuido = niveis.reduce(
      (acc, nivel) => acc + nivel.percentualTotal,
      0,
    );

    const diasParaEstorno = Number.parseInt(parsed.data.diasParaEstorno, 10);
    const exemploEstorno = calcularDataLimiteEstorno(
      new Date().toISOString(),
      diasParaEstorno,
    );

    return {
      niveis,
      totalDistribuidoCentavos,
      percentualDistribuido,
      diasParaEstorno,
      exemploEstorno,
    } as const;
  }, [distribuicao, valorCreditoCentavos]);

  return (
    <div className={`${panelClass()} mt-6 border-dashed bg-zinc-50/80 p-5`}>
      <div className="text-sm font-medium text-zinc-900">Simulação do motor financeiro</div>
      <p className="mt-1 text-xs leading-5 text-zinc-500">
        Total das comissões distribuídas (Empresa + Vendedor + Supervisor + Diretor) sobre o
        crédito informado.
      </p>

      {"error" in preview ? (
        <p className="mt-4 text-sm text-zinc-500">{preview.error}</p>
      ) : (
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Total das comissões distribuídas
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
                {formatMoneyPtBrFromCentavos(preview.totalDistribuidoCentavos)}
              </div>
            </div>
            <div className="text-right text-xs text-zinc-500">
              {formatPercentualInput(preview.percentualDistribuido)}% sobre{" "}
              {formatMoneyPtBrFromCentavos(valorCreditoCentavos!)}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {preview.niveis.map((nivel) => (
              <div
                key={nivel.key}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {nivel.label}
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">
                  {formatMoneyPtBrFromCentavos(nivel.valorCentavos)}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {formatPercentualInput(nivel.percentualTotal)}% do crédito ·{" "}
                  {nivel.parcelas.length} parcela{nivel.parcelas.length === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>

          {preview.exemploEstorno ? (
            <p className="text-xs text-zinc-500">
              Prazo de estorno: {preview.diasParaEstorno} dias — vendas canceladas dentro desse
              prazo removem extratos pendentes/liberados (ex.: limite hoje seria{" "}
              {preview.exemploEstorno.toLocaleDateString("pt-BR")}).
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

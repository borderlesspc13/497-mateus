import {
  EMPTY_REGRAS_REPASSE_FORM,
  type RegraRepassePapel,
  type RegrasRepassePlano,
  parseRegrasRepasseJson,
} from "@/lib/comissoes/regras-repasse";
import type { PlanoRow } from "@/lib/types/domain";
import {
  criarParcelasVazias,
  distribuirPercentualIgualmente,
  EMPTY_DISTRIBUICAO_COMISSAO,
  formatPercentualInput,
  parsePercentualInput,
  type DistribuicaoComissaoFormValues,
  type NivelDistribuicaoFormValues,
} from "@/lib/planos/distribuicao-comissao-schema";

export type DistribuicaoComissaoPayload = {
  percentualComissao: number;
  parcelasRecebimento: number;
  diasParaEstorno: number;
  percentuaisRecebimentoJson: string;
  regrasRepasseJson: string;
};

function pesosParaPercentuais(total: number, pesos: number[]): number[] {
  const somaPesos = pesos.reduce((acc, peso) => acc + peso, 0);
  if (somaPesos <= 0) return pesos.map(() => 0);

  const valores = pesos.map((peso) => (total * peso) / somaPesos);
  const arredondados = valores.map((valor) => Math.round(valor * 10_000) / 10_000);
  const diff = Math.round((total - arredondados.reduce((acc, valor) => acc + valor, 0)) * 10_000) / 10_000;
  if (diff !== 0) {
    const idx = arredondados.findIndex((valor) => valor > 0);
    if (idx >= 0) arredondados[idx] = Math.round((arredondados[idx] + diff) * 10_000) / 10_000;
  }
  return arredondados;
}

function resolverPercentuaisParcelas(
  total: number,
  parcelasTotal: number,
  percentuaisParcelas?: number[],
  pesosParcelas?: number[],
): number[] {
  if (percentuaisParcelas?.length === parcelasTotal) {
    return percentuaisParcelas;
  }
  if (pesosParcelas?.length === parcelasTotal) {
    return pesosParaPercentuais(total, pesosParcelas);
  }
  return distribuirPercentualIgualmente(total, parcelasTotal).map((parcela) =>
    parsePercentualInput(parcela.percentual),
  );
}

function nivelFromPercentuais(
  percentualTotal: number,
  parcelasTotal: number,
  percentuaisParcelas: number[],
): NivelDistribuicaoFormValues {
  return {
    percentualTotal: formatPercentualInput(percentualTotal),
    numeroParcelas: parcelasTotal,
    parcelas: percentuaisParcelas.map((percentual) => ({
      percentual: formatPercentualInput(percentual),
    })),
  };
}

function nivelFromRegra(regra: RegraRepassePapel): NivelDistribuicaoFormValues {
  const percentuais = resolverPercentuaisParcelas(
    regra.percentualSobreCredito,
    regra.parcelasTotal,
    regra.percentuaisParcelas,
    regra.pesosParcelas,
  );
  return nivelFromPercentuais(regra.percentualSobreCredito, regra.parcelasTotal, percentuais);
}

function mapNivelToRegra(nivel: NivelDistribuicaoFormValues): RegraRepassePapel {
  const percentualSobreCredito = parsePercentualInput(nivel.percentualTotal);
  const percentuaisParcelas = nivel.parcelas.map((parcela) =>
    parsePercentualInput(parcela.percentual),
  );

  return {
    percentualSobreCredito,
    parcelasTotal: nivel.numeroParcelas,
    percentuaisParcelas,
  };
}

export function distribuicaoFromPlano(item: Pick<
  PlanoRow,
  | "percentualComissao"
  | "parcelasRecebimento"
  | "diasParaEstorno"
  | "percentuaisRecebimentoJson"
  | "regrasRepasseJson"
>): DistribuicaoComissaoFormValues {
  const regrasRepasse = parseRegrasRepasseJson(item.regrasRepasseJson);
  const percentualEmpresa = item.percentualComissao ?? 0;
  const parcelasEmpresa = item.parcelasRecebimento ?? 3;

  let percentuaisEmpresa: number[] = [];
  if (item.percentuaisRecebimentoJson?.trim()) {
    try {
      const parsed: unknown = JSON.parse(item.percentuaisRecebimentoJson);
      if (Array.isArray(parsed)) {
        percentuaisEmpresa = parsed.filter((valor): valor is number => typeof valor === "number");
      }
    } catch {
      percentuaisEmpresa = [];
    }
  }

  if (percentuaisEmpresa.length !== parcelasEmpresa && percentualEmpresa > 0) {
    percentuaisEmpresa = resolverPercentuaisParcelas(
      percentualEmpresa,
      parcelasEmpresa,
      percentuaisEmpresa.length === parcelasEmpresa ? percentuaisEmpresa : undefined,
    );
  }

  const empresa =
    percentualEmpresa > 0
      ? nivelFromPercentuais(percentualEmpresa, parcelasEmpresa, percentuaisEmpresa)
      : EMPTY_DISTRIBUICAO_COMISSAO.empresa;

  return {
    empresa,
    vendedor: regrasRepasse ? nivelFromRegra(regrasRepasse.vendedor) : EMPTY_DISTRIBUICAO_COMISSAO.vendedor,
    supervisor: regrasRepasse
      ? nivelFromRegra(regrasRepasse.supervisor)
      : EMPTY_DISTRIBUICAO_COMISSAO.supervisor,
    diretor: regrasRepasse ? nivelFromRegra(regrasRepasse.diretor) : EMPTY_DISTRIBUICAO_COMISSAO.diretor,
    diasParaEstorno: item.diasParaEstorno?.toString() ?? "90",
  };
}

export function mapDistribuicaoToPayload(
  form: DistribuicaoComissaoFormValues,
): DistribuicaoComissaoPayload {
  const percentuaisEmpresa = form.empresa.parcelas.map((parcela) =>
    parsePercentualInput(parcela.percentual),
  );

  const regrasRepasse: RegrasRepassePlano = {
    vendedor: mapNivelToRegra(form.vendedor),
    supervisor: mapNivelToRegra(form.supervisor),
    diretor: mapNivelToRegra(form.diretor),
  };

  return {
    percentualComissao: parsePercentualInput(form.empresa.percentualTotal),
    parcelasRecebimento: form.empresa.numeroParcelas,
    diasParaEstorno: Number.parseInt(form.diasParaEstorno, 10),
    percentuaisRecebimentoJson: JSON.stringify(percentuaisEmpresa),
    regrasRepasseJson: JSON.stringify(regrasRepasse),
  };
}

export function parsePercentuaisRecebimentoJson(json: string | null | undefined): number[] | null {
  if (!json?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    const valores = parsed.filter((valor): valor is number => typeof valor === "number" && valor >= 0);
    return valores.length > 0 ? valores : null;
  } catch {
    return null;
  }
}

export { EMPTY_DISTRIBUICAO_COMISSAO, EMPTY_REGRAS_REPASSE_FORM };

/** Regras financeiras estruturadas de um plano. */
export type RegrasFinanceirasPlano = {
  percentualComissao: number;
  parcelasRecebimento: number;
  diasParaEstorno: number;
};

/** Converte percentual humano (ex.: 2.5) para basis points inteiros (250). */
export function percentualToBasisPoints(percentual: number): number {
  return Math.round(percentual * 100);
}

/**
 * Comissão total em centavos: crédito × percentual, sem ponto flutuante.
 * @param creditoCentavos valor do crédito em centavos
 * @param percentualComissao ex.: 2.5 para 2,5%
 */
export function calcularComissaoTotalCentavos(
  creditoCentavos: number,
  percentualComissao: number,
): number {
  if (creditoCentavos <= 0 || percentualComissao <= 0) return 0;
  const basisPoints = percentualToBasisPoints(percentualComissao);
  return Math.round((creditoCentavos * basisPoints) / 10_000);
}

/**
 * Divide o total em N parcelas inteiras (centavos); o resto vai para as primeiras parcelas.
 */
export function dividirComissaoEmParcelas(
  totalCentavos: number,
  parcelas: number,
): number[] {
  if (parcelas < 1) return [];
  if (totalCentavos <= 0) return Array.from({ length: parcelas }, () => 0);

  const base = Math.floor(totalCentavos / parcelas);
  const resto = totalCentavos - base * parcelas;

  return Array.from({ length: parcelas }, (_, i) => base + (i < resto ? 1 : 0));
}

export type ParcelaComissaoCalculada = {
  numero: number;
  label: string;
  valorCentavos: number;
};

export function calcularParcelasComissao(
  creditoCentavos: number,
  regras: RegrasFinanceirasPlano,
): ParcelaComissaoCalculada[] {
  const total = calcularComissaoTotalCentavos(creditoCentavos, regras.percentualComissao);
  const valores = dividirComissaoEmParcelas(total, regras.parcelasRecebimento);

  return valores.map((valorCentavos, idx) => ({
    numero: idx + 1,
    label: `P${idx + 1}`,
    valorCentavos,
  }));
}

/** Crédito da venda: valor da venda ou, se ausente, crédito padrão do plano. */
export function resolverCreditoCentavos(
  valorVendaCentavos: number | null,
  valorPlanoCentavos: number | null,
): number | null {
  if (valorVendaCentavos !== null && valorVendaCentavos > 0) return valorVendaCentavos;
  if (valorPlanoCentavos !== null && valorPlanoCentavos > 0) return valorPlanoCentavos;
  return null;
}

export function extratoDocId(vendaId: string, parcelaNumero: number): string {
  return `${vendaId}_p${parcelaNumero}`;
}

export function extratoEstornoDocId(vendaId: string): string {
  return `${vendaId}_estorno`;
}

export type EstornoCalculado = {
  aplicaEstorno: boolean;
  valorEstornoCentavos: number;
  parcelasDevolvidas: number;
  motivo: string | null;
};

/**
 * Calcula o valor de estorno quando o cancelamento ocorre antes de completar
 * as parcelas mínimas definidas no plano (parcelasRecebimento).
 * Devolve a comissão das parcelas de recebimento ainda não consolidadas.
 */
export function calcularEstorno(
  creditoCentavos: number,
  regras: RegrasFinanceirasPlano,
  parcelasPagas: number,
): EstornoCalculado {
  const parcelaMinima = regras.parcelasRecebimento;

  if (!Number.isInteger(parcelasPagas) || parcelasPagas < 0) {
    return {
      aplicaEstorno: false,
      valorEstornoCentavos: 0,
      parcelasDevolvidas: 0,
      motivo: "Quantidade de parcelas pagas inválida.",
    };
  }

  if (parcelasPagas >= parcelaMinima) {
    return {
      aplicaEstorno: false,
      valorEstornoCentavos: 0,
      parcelasDevolvidas: 0,
      motivo: null,
    };
  }

  const parcelasComissao = calcularParcelasComissao(creditoCentavos, regras);
  if (parcelasComissao.length === 0) {
    return {
      aplicaEstorno: false,
      valorEstornoCentavos: 0,
      parcelasDevolvidas: 0,
      motivo: null,
    };
  }

  const parcelasAEstornar = parcelasComissao.slice(parcelasPagas);
  const valorEstornoCentavos = parcelasAEstornar.reduce((sum, p) => sum + p.valorCentavos, 0);

  if (valorEstornoCentavos <= 0) {
    return {
      aplicaEstorno: false,
      valorEstornoCentavos: 0,
      parcelasDevolvidas: 0,
      motivo: null,
    };
  }

  return {
    aplicaEstorno: true,
    valorEstornoCentavos,
    parcelasDevolvidas: parcelasAEstornar.length,
    motivo: `Cancelamento com ${parcelasPagas} parcela(s) paga(s), inferior ao mínimo de ${parcelaMinima} exigido pelo plano.`,
  };
}

const MS_POR_DIA = 86_400_000;

/** Verifica se a data de referência ainda está dentro da janela de estorno. */
export function isDentroPrazoEstorno(
  dataReferenciaIso: string | null,
  diasParaEstorno: number,
  referencia: Date = new Date(),
): boolean {
  if (!dataReferenciaIso || diasParaEstorno < 1) return false;

  const inicio = new Date(dataReferenciaIso);
  if (Number.isNaN(inicio.getTime())) return false;

  const limite = inicio.getTime() + diasParaEstorno * MS_POR_DIA;
  return referencia.getTime() <= limite;
}

/** Data limite formatável para exibição na UI de planos. */
export function calcularDataLimiteEstorno(
  dataReferenciaIso: string,
  diasParaEstorno: number,
): Date | null {
  const inicio = new Date(dataReferenciaIso);
  if (Number.isNaN(inicio.getTime()) || diasParaEstorno < 1) return null;
  return new Date(inicio.getTime() + diasParaEstorno * MS_POR_DIA);
}

export type VendaStatusMotor = "ATIVO" | "INADIMPLENTE" | "CANCELADO";

/** Vendas ativas geram ou mantêm extratos de comissão. */
export function vendaGeraExtratosComissao(status: VendaStatusMotor): boolean {
  return status === "ATIVO";
}

/**
 * Extratos pendentes/liberados devem ser removidos quando a venda deixa de ser ativa
 * e ainda está dentro do prazo de estorno configurado no plano.
 */
export function extratoDeveSerEstornado(
  vendaStatus: VendaStatusMotor,
  dataReferenciaIso: string | null,
  diasParaEstorno: number,
  extratoStatus: "PENDENTE" | "LIBERADO" | "PAGO",
): boolean {
  if (vendaStatus === "ATIVO" || extratoStatus === "PAGO") return false;
  if (extratoStatus === "PENDENTE") return true;
  if (extratoStatus === "LIBERADO") {
    return vendaStatus === "CANCELADO" && isDentroPrazoEstorno(dataReferenciaIso, diasParaEstorno);
  }
  return false;
}

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

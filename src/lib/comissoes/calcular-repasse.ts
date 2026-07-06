import type { PapelRepasse, RegraRepassePapel, RegrasRepassePlano } from "@/lib/comissoes/regras-repasse";
import { calcularComissaoTotalCentavos } from "@/utils/financeiro";

export type RepasseCalculado = {
  papel: PapelRepasse;
  parcelaNumero: number;
  parcelaLabel: string;
  valorCentavos: number;
  percentualPapel: number;
};

function resolvePesosParcelas(regra: RegraRepassePapel): number[] {
  if (regra.pesosParcelas && regra.pesosParcelas.length === regra.parcelasTotal) {
    return regra.pesosParcelas;
  }
  return Array.from({ length: regra.parcelasTotal }, () => 1);
}

function calcularValorParcelaRepasse(
  creditoCentavos: number,
  regra: RegraRepassePapel,
  parcelaNumero: number,
): number {
  if (parcelaNumero < 1 || parcelaNumero > regra.parcelasTotal) return 0;

  const totalPapelCentavos = calcularComissaoTotalCentavos(
    creditoCentavos,
    regra.percentualSobreCredito,
  );
  if (totalPapelCentavos <= 0) return 0;

  const pesos = resolvePesosParcelas(regra);
  const pesoParcela = pesos[parcelaNumero - 1] ?? 0;
  if (pesoParcela <= 0) return 0;

  const somaPesos = pesos.reduce((sum, peso) => sum + peso, 0);
  if (somaPesos <= 0) return 0;

  return Math.round((totalPapelCentavos * pesoParcela) / somaPesos);
}

/** Calcula repasses internos de uma parcela administradora recebida. */
export function calcularRepassesParcela(
  creditoCentavos: number,
  regras: RegrasRepassePlano,
  parcelaNumero: number,
): RepasseCalculado[] {
  const papeis: Array<{ papel: PapelRepasse; regra: RegraRepassePapel }> = [
    { papel: "VENDEDOR", regra: regras.vendedor },
    { papel: "SUPERVISOR", regra: regras.supervisor },
    { papel: "DIRETOR", regra: regras.diretor },
  ];

  const resultados: RepasseCalculado[] = [];

  for (const { papel, regra } of papeis) {
    if (parcelaNumero > regra.parcelasTotal) continue;

    const valorCentavos = calcularValorParcelaRepasse(creditoCentavos, regra, parcelaNumero);
    if (valorCentavos <= 0) continue;

    resultados.push({
      papel,
      parcelaNumero,
      parcelaLabel: `P${parcelaNumero}`,
      valorCentavos,
      percentualPapel: regra.percentualSobreCredito,
    });
  }

  return resultados;
}

export function repasseDocId(extratoOrigemId: string, papel: PapelRepasse): string {
  return `${extratoOrigemId}_${papel.toLowerCase()}`;
}

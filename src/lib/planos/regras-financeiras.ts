import type { PlanoDoc } from "@/lib/firestore/types";
import { parsePercentuaisRecebimentoJson } from "@/lib/planos/distribuicao-comissao-mappers";
import type { RegrasFinanceirasPlano } from "@/utils/financeiro";

function parseLegacyJson<T extends Record<string, unknown>>(json: string | null): T | null {
  if (!json?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === "object" && parsed !== null ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function resolvePercentualFromLegacy(regrasComissaoJson: string | null | undefined): number | null {
  const legacy = parseLegacyJson<{ percentual?: number; percentualComissao?: number }>(
    regrasComissaoJson ?? null,
  );
  if (!legacy) return null;
  const raw = legacy.percentualComissao ?? legacy.percentual;
  if (typeof raw !== "number" || raw <= 0) return null;
  return raw < 1 ? raw * 100 : raw;
}

function resolveParcelasFromLegacy(regrasRecebimentoJson: string | null | undefined): number | null {
  const legacy = parseLegacyJson<{ parcelas?: number; parcelasRecebimento?: number }>(
    regrasRecebimentoJson ?? null,
  );
  if (!legacy) return null;
  const raw = legacy.parcelasRecebimento ?? legacy.parcelas;
  if (typeof raw !== "number" || raw < 1) return null;
  return Math.floor(raw);
}

function resolveDiasEstornoFromLegacy(regrasEstornoJson: string | null | undefined): number | null {
  const legacy = parseLegacyJson<{ prazoDias?: number; dias?: number; diasParaEstorno?: number }>(
    regrasEstornoJson ?? null,
  );
  if (!legacy) return null;
  const raw = legacy.diasParaEstorno ?? legacy.prazoDias ?? legacy.dias;
  if (typeof raw !== "number" || raw < 1) return null;
  return Math.floor(raw);
}

/** Lê regras estruturadas ou faz fallback para JSON legado. */
export function resolvePlanoRegrasFinanceiras(
  plano: Pick<
    PlanoDoc,
    | "percentualComissao"
    | "parcelasRecebimento"
    | "diasParaEstorno"
    | "percentuaisRecebimentoJson"
    | "regrasComissaoJson"
    | "regrasRecebimentoJson"
    | "regrasEstornoJson"
  >,
): RegrasFinanceirasPlano | null {
  const percentualComissao =
    plano.percentualComissao ?? resolvePercentualFromLegacy(plano.regrasComissaoJson);
  const parcelasRecebimento =
    plano.parcelasRecebimento ?? resolveParcelasFromLegacy(plano.regrasRecebimentoJson);
  const diasParaEstorno =
    plano.diasParaEstorno ?? resolveDiasEstornoFromLegacy(plano.regrasEstornoJson);

  if (
    percentualComissao === null ||
    parcelasRecebimento === null ||
    diasParaEstorno === null
  ) {
    return null;
  }

  const percentuaisParcelas = parsePercentuaisRecebimentoJson(plano.percentuaisRecebimentoJson);

  return {
    percentualComissao,
    parcelasRecebimento,
    diasParaEstorno,
    ...(percentuaisParcelas?.length === parcelasRecebimento
      ? { percentuaisParcelas }
      : {}),
  };
}

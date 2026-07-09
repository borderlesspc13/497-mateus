import type { PlanoDoc } from "@/lib/firestore/types";

export type PapelRepasse = "VENDEDOR" | "SUPERVISOR" | "DIRETOR";

export const PAPEIS_REPASSE: PapelRepasse[] = ["VENDEDOR", "SUPERVISOR", "DIRETOR"];

export const PAPEL_REPASSE_LABELS: Record<PapelRepasse, string> = {
  VENDEDOR: "Vendedor",
  SUPERVISOR: "Supervisor",
  DIRETOR: "Diretor",
};

/** Regra fracionada de repasse interno para um papel da hierarquia. */
export type RegraRepassePapel = {
  /** Percentual sobre o crédito da venda (ex.: 2.2 = 2,2%). */
  percentualSobreCredito: number;
  /** Quantidade de parcelas do repasse deste papel. */
  parcelasTotal: number;
  /** Percentual exato de cada parcela (índice 0 = P1). Soma deve igualar percentualSobreCredito. */
  percentuaisParcelas?: number[];
  /**
   * @deprecated Use percentuaisParcelas. Pesos relativos por parcela.
   * Se omitido, divide igualmente entre todas as parcelas.
   */
  pesosParcelas?: number[];
};

export type RegrasRepassePlano = {
  vendedor: RegraRepassePapel;
  supervisor: RegraRepassePapel;
  diretor: RegraRepassePapel;
};

export type RegrasRepasseFormPapel = {
  percentualSobreCredito: string;
  parcelasTotal: string;
  /** @deprecated Mantido para compatibilidade com formulários legados. */
  pesosParcelas: string;
  percentuaisParcelas: string;
};

export type RegrasRepasseFormState = {
  vendedor: RegrasRepasseFormPapel;
  supervisor: RegrasRepasseFormPapel;
  diretor: RegrasRepasseFormPapel;
};

export const EMPTY_REGRAS_REPASSE_FORM: RegrasRepasseFormState = {
  vendedor: { percentualSobreCredito: "", parcelasTotal: "3", pesosParcelas: "", percentuaisParcelas: "" },
  supervisor: { percentualSobreCredito: "", parcelasTotal: "3", pesosParcelas: "", percentuaisParcelas: "" },
  diretor: { percentualSobreCredito: "", parcelasTotal: "3", pesosParcelas: "1,0,1", percentuaisParcelas: "" },
};

function parsePercentuaisParcelas(
  raw: string,
  parcelasTotal: number,
  percentualTotal: number,
): number[] | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const parts = trimmed.split(/[,;\s]+/).map((p) => Number(p.replace(",", ".")));
  if (parts.length !== parcelasTotal) {
    throw new Error(`Informe ${parcelasTotal} percentual(is) de parcela separados por vírgula.`);
  }
  if (parts.some((p) => !Number.isFinite(p) || p < 0)) {
    throw new Error("Os percentuais das parcelas devem ser números maiores ou iguais a zero.");
  }
  if (parts.every((p) => p === 0)) {
    throw new Error("Ao menos uma parcela deve ter percentual maior que zero.");
  }

  const soma = parts.reduce((acc, valor) => acc + valor, 0);
  if (Math.abs(soma - percentualTotal) > 0.01) {
    throw new Error("A soma dos percentuais das parcelas deve ser igual ao percentual total.");
  }

  return parts;
}

function parsePesosParcelas(raw: string, parcelasTotal: number): number[] | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const parts = trimmed.split(/[,;\s]+/).map((p) => Number(p.replace(",", ".")));
  if (parts.length !== parcelasTotal) {
    throw new Error(`Informe ${parcelasTotal} peso(s) de parcela separados por vírgula.`);
  }
  if (parts.some((p) => !Number.isFinite(p) || p < 0)) {
    throw new Error("Os pesos das parcelas devem ser números maiores ou iguais a zero.");
  }
  if (parts.every((p) => p === 0)) {
    throw new Error("Ao menos uma parcela deve ter peso maior que zero.");
  }
  return parts;
}

function parsePapelForm(
  papel: PapelRepasse,
  form: RegrasRepasseFormPapel,
): RegraRepassePapel | null {
  const percentualRaw = form.percentualSobreCredito.trim();
  const parcelasRaw = form.parcelasTotal.trim();
  if (!percentualRaw && !parcelasRaw && !form.pesosParcelas.trim() && !form.percentuaisParcelas.trim()) {
    return null;
  }
  if (!percentualRaw) {
    throw new Error(`Informe o percentual de repasse do ${PAPEL_REPASSE_LABELS[papel]}.`);
  }

  const percentualSobreCredito = Number(percentualRaw.replace(",", "."));
  const parcelasTotal = Number.parseInt(parcelasRaw, 10);

  if (!Number.isFinite(percentualSobreCredito) || percentualSobreCredito <= 0 || percentualSobreCredito > 100) {
    throw new Error(`Percentual inválido para ${PAPEL_REPASSE_LABELS[papel]}.`);
  }
  if (!Number.isInteger(parcelasTotal) || parcelasTotal < 1 || parcelasTotal > 24) {
    throw new Error(`Parcelas inválidas para ${PAPEL_REPASSE_LABELS[papel]} (use 1 a 24).`);
  }

  const percentuaisParcelas =
    parsePercentuaisParcelas(form.percentuaisParcelas, parcelasTotal, percentualSobreCredito) ??
    undefined;
  const pesosParcelas = percentuaisParcelas
    ? undefined
    : parsePesosParcelas(form.pesosParcelas, parcelasTotal);

  return {
    percentualSobreCredito,
    parcelasTotal,
    ...(percentuaisParcelas ? { percentuaisParcelas } : {}),
    ...(pesosParcelas ? { pesosParcelas } : {}),
  };
}

export function parseRegrasRepasseForm(
  form: RegrasRepasseFormState,
): RegrasRepassePlano | null | { error: string } {
  try {
    const vendedor = parsePapelForm("VENDEDOR", form.vendedor);
    const supervisor = parsePapelForm("SUPERVISOR", form.supervisor);
    const diretor = parsePapelForm("DIRETOR", form.diretor);

    if (!vendedor && !supervisor && !diretor) return null;
    if (!vendedor || !supervisor || !diretor) {
      return {
        error: "Preencha as regras de repasse dos três papéis ou deixe todos vazios.",
      };
    }

    return { vendedor, supervisor, diretor };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Regras de repasse inválidas." };
  }
}

export function regrasRepasseToForm(regras: RegrasRepassePlano | null): RegrasRepasseFormState {
  if (!regras) return { ...EMPTY_REGRAS_REPASSE_FORM };

  function papelToForm(papel: RegraRepassePapel): RegrasRepasseFormPapel {
    return {
      percentualSobreCredito: papel.percentualSobreCredito.toString(),
      parcelasTotal: papel.parcelasTotal.toString(),
      percentuaisParcelas: papel.percentuaisParcelas?.join(",") ?? "",
      pesosParcelas: papel.pesosParcelas?.join(",") ?? "",
    };
  }

  return {
    vendedor: papelToForm(regras.vendedor),
    supervisor: papelToForm(regras.supervisor),
    diretor: papelToForm(regras.diretor),
  };
}

export function serializeRegrasRepasse(regras: RegrasRepassePlano): string {
  return JSON.stringify(regras);
}

function isRegraRepassePapel(value: unknown): value is RegraRepassePapel {
  if (!value || typeof value !== "object") return false;
  const v = value as RegraRepassePapel;
  return (
    typeof v.percentualSobreCredito === "number" &&
    v.percentualSobreCredito > 0 &&
    typeof v.parcelasTotal === "number" &&
    v.parcelasTotal >= 1
  );
}

export function parseRegrasRepasseJson(json: string | null | undefined): RegrasRepassePlano | null {
  if (!json?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Partial<RegrasRepassePlano>;
    if (
      !isRegraRepassePapel(data.vendedor) ||
      !isRegraRepassePapel(data.supervisor) ||
      !isRegraRepassePapel(data.diretor)
    ) {
      return null;
    }
    return {
      vendedor: data.vendedor,
      supervisor: data.supervisor,
      diretor: data.diretor,
    };
  } catch {
    return null;
  }
}

export function resolvePlanoRegrasRepasse(
  plano: Pick<PlanoDoc, "regrasRepasseJson">,
): RegrasRepassePlano | null {
  return parseRegrasRepasseJson(plano.regrasRepasseJson);
}

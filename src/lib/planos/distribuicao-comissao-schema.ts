import { z } from "zod";

export const TOLERANCIA_SOMA_PERCENTUAL = 0.01;

export function parsePercentualInput(raw: string): number {
  const normalized = raw.replace(",", ".").trim();
  if (!normalized) return NaN;
  return Number(normalized);
}

export function formatPercentualInput(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

const parcelaSchema = z.object({
  percentual: z.string(),
});

function validarNivel(
  data: {
    percentualTotal: string;
    numeroParcelas: number;
    parcelas: { percentual: string }[];
  },
  ctx: z.RefinementCtx,
  pathPrefix: string,
  permiteParcelasZeradas: boolean,
) {
  const total = parsePercentualInput(data.percentualTotal);
  if (!Number.isFinite(total) || total <= 0 || total > 100) {
    ctx.addIssue({
      code: "custom",
      message: "Informe um percentual total válido entre 0 e 100.",
      path: [pathPrefix, "percentualTotal"],
    });
    return;
  }

  if (data.parcelas.length !== data.numeroParcelas) {
    ctx.addIssue({
      code: "custom",
      message: `Defina os percentuais das ${data.numeroParcelas} parcelas.`,
      path: [pathPrefix, "parcelas"],
    });
    return;
  }

  const valores = data.parcelas.map((parcela) => parsePercentualInput(parcela.percentual));
  if (valores.some((valor) => !Number.isFinite(valor) || valor < 0)) {
    ctx.addIssue({
      code: "custom",
      message: "Cada parcela deve ter um percentual numérico maior ou igual a zero.",
      path: [pathPrefix, "parcelas"],
    });
    return;
  }

  const parcelasAtivas = valores.filter((valor) => valor > 0);
  if (!permiteParcelasZeradas && parcelasAtivas.length !== valores.length) {
    ctx.addIssue({
      code: "custom",
      message: "Todas as parcelas devem ter percentual maior que zero.",
      path: [pathPrefix, "parcelas"],
    });
    return;
  }

  if (permiteParcelasZeradas && parcelasAtivas.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Ao menos uma parcela deve ter percentual maior que zero.",
      path: [pathPrefix, "parcelas"],
    });
    return;
  }

  const soma = valores.reduce((acc, valor) => acc + valor, 0);
  if (Math.abs(soma - total) > TOLERANCIA_SOMA_PERCENTUAL) {
    ctx.addIssue({
      code: "custom",
      message: `A soma das parcelas (${formatPercentualInput(soma)}%) deve ser igual ao percentual total (${formatPercentualInput(total)}%).`,
      path: [pathPrefix, "parcelas"],
    });
  }
}

const nivelBaseSchema = z.object({
  percentualTotal: z.string().min(1, "Informe o percentual total."),
  numeroParcelas: z.number().int().min(1).max(24),
  parcelas: z.array(parcelaSchema).min(1),
});

export const distribuicaoComissaoSchema = z
  .object({
    empresa: nivelBaseSchema,
    vendedor: nivelBaseSchema,
    supervisor: nivelBaseSchema,
    diretor: nivelBaseSchema,
    diasParaEstorno: z.string().min(1, "Informe os dias para estorno."),
  })
  .superRefine((data, ctx) => {
    validarNivel(data.empresa, ctx, "empresa", false);
    validarNivel(data.vendedor, ctx, "vendedor", false);
    validarNivel(data.supervisor, ctx, "supervisor", false);
    validarNivel(data.diretor, ctx, "diretor", true);

    const dias = Number.parseInt(data.diasParaEstorno, 10);
    if (!Number.isInteger(dias) || dias < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Dias para estorno deve ser um inteiro maior que zero.",
        path: ["diasParaEstorno"],
      });
    }
  });

export type DistribuicaoComissaoFormValues = z.infer<typeof distribuicaoComissaoSchema>;

export type NivelDistribuicaoFormValues = DistribuicaoComissaoFormValues["empresa"];

export function criarParcelasVazias(quantidade: number): { percentual: string }[] {
  return Array.from({ length: quantidade }, () => ({ percentual: "" }));
}

export function distribuirPercentualIgualmente(
  percentualTotal: number,
  quantidade: number,
): { percentual: string }[] {
  if (quantidade < 1) return [];

  const totalCentesimos = Math.round(percentualTotal * 100);
  const base = Math.floor(totalCentesimos / quantidade);
  const resto = totalCentesimos - base * quantidade;

  return Array.from({ length: quantidade }, (_, index) => {
    const centesimos = base + (index < resto ? 1 : 0);
    return { percentual: formatPercentualInput(centesimos / 100) };
  });
}

export const EMPTY_DISTRIBUICAO_COMISSAO: DistribuicaoComissaoFormValues = {
  empresa: {
    percentualTotal: "",
    numeroParcelas: 3,
    parcelas: criarParcelasVazias(3),
  },
  vendedor: {
    percentualTotal: "",
    numeroParcelas: 7,
    parcelas: criarParcelasVazias(7),
  },
  supervisor: {
    percentualTotal: "",
    numeroParcelas: 4,
    parcelas: criarParcelasVazias(4),
  },
  diretor: {
    percentualTotal: "",
    numeroParcelas: 3,
    parcelas: criarParcelasVazias(3),
  },
  diasParaEstorno: "90",
};

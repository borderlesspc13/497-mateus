"use client";

import { formControlClass } from "@/components/ui/list-panel-classes";

export type RegrasFinanceirasFormState = {
  percentualComissao: string;
  parcelasRecebimento: string;
  diasParaEstorno: string;
};

export function parseRegrasFinanceirasForm(form: RegrasFinanceirasFormState): {
  percentualComissao: number;
  parcelasRecebimento: number;
  diasParaEstorno: number;
} | { error: string } {
  const percentual = Number(form.percentualComissao.replace(",", "."));
  const parcelas = Number(form.parcelasRecebimento);
  const dias = Number(form.diasParaEstorno);

  if (!Number.isFinite(percentual) || percentual <= 0 || percentual > 100) {
    return { error: "Percentual de comissão inválido (use ex.: 2.5)." };
  }
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 24) {
    return { error: "Parcelas de recebimento deve ser um inteiro entre 1 e 24." };
  }
  if (!Number.isInteger(dias) || dias < 1) {
    return { error: "Dias para estorno deve ser um inteiro maior que zero." };
  }

  return {
    percentualComissao: percentual,
    parcelasRecebimento: parcelas,
    diasParaEstorno: dias,
  };
}

type RegrasFinanceirasFieldsProps = {
  form: RegrasFinanceirasFormState;
  onChange: (patch: Partial<RegrasFinanceirasFormState>) => void;
};

export function RegrasFinanceirasFields({ form, onChange }: RegrasFinanceirasFieldsProps) {
  return (
    <div className="mt-8">
      <div className="text-sm font-medium">Regras financeiras</div>
      <p className="mt-2 text-xs text-zinc-500">
        Parâmetros usados pelo motor de comissões para gerar extratos e parcelas (P1, P2, P3…).
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Percentual de comissão (%) <span className="text-red-600">*</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={form.percentualComissao}
            onChange={(e) => onChange({ percentualComissao: e.target.value })}
            placeholder="2.5"
            className={formControlClass()}
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Parcelas de recebimento <span className="text-red-600">*</span>
          </div>
          <input
            type="number"
            min={1}
            max={24}
            value={form.parcelasRecebimento}
            onChange={(e) => onChange({ parcelasRecebimento: e.target.value })}
            placeholder="3"
            className={formControlClass()}
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Dias para estorno <span className="text-red-600">*</span>
          </div>
          <input
            type="number"
            min={1}
            value={form.diasParaEstorno}
            onChange={(e) => onChange({ diasParaEstorno: e.target.value })}
            placeholder="90"
            className={formControlClass()}
          />
        </label>
      </div>
    </div>
  );
}

"use client";

import {
  EMPTY_REGRAS_REPASSE_FORM,
  PAPEL_REPASSE_LABELS,
  PAPEIS_REPASSE,
  type RegrasRepasseFormState,
} from "@/lib/comissoes/regras-repasse";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";

export type { RegrasRepasseFormState };
export { EMPTY_REGRAS_REPASSE_FORM };

type RegrasRepasseFieldsProps = {
  form: RegrasRepasseFormState;
  onChange: (patch: Partial<RegrasRepasseFormState>) => void;
};

export function RegrasRepasseFields({ form, onChange }: RegrasRepasseFieldsProps) {
  return (
    <div className={`${panelClass()} mt-8 border-zinc-200/80 p-5`}>
      <div className="text-sm font-semibold text-zinc-900">Regras de repasse interno</div>
      <p className="mt-1.5 text-xs leading-5 text-zinc-500">
        Hierarquia por produto: ao marcar um extrato como recebido da administradora, o sistema
        gera automaticamente as linhas de repasse. Use pesos por parcela (ex.:{" "}
        <span className="font-mono">1,0,1</span> para o diretor receber só na P1 e P3).
      </p>

      <div className="mt-5 space-y-6">
        {PAPEIS_REPASSE.map((papel) => {
          const papelForm = form[papel.toLowerCase() as keyof RegrasRepasseFormState];
          return (
            <div key={papel} className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                {PAPEL_REPASSE_LABELS[papel]}
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                <label className="block">
                  <div className="mb-1 text-xs font-medium text-zinc-600">% sobre crédito</div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={papelForm.percentualSobreCredito}
                    onChange={(e) =>
                      onChange({
                        [papel.toLowerCase()]: {
                          ...papelForm,
                          percentualSobreCredito: e.target.value,
                        },
                      } as Partial<RegrasRepasseFormState>)
                    }
                    placeholder="2.2"
                    className={formControlClass()}
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-xs font-medium text-zinc-600">Parcelas</div>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={papelForm.parcelasTotal}
                    onChange={(e) =>
                      onChange({
                        [papel.toLowerCase()]: {
                          ...papelForm,
                          parcelasTotal: e.target.value,
                        },
                      } as Partial<RegrasRepasseFormState>)
                    }
                    className={formControlClass()}
                  />
                </label>
                <label className="block md:col-span-1">
                  <div className="mb-1 text-xs font-medium text-zinc-600">
                    Pesos por parcela
                  </div>
                  <input
                    type="text"
                    value={papelForm.pesosParcelas}
                    onChange={(e) =>
                      onChange({
                        [papel.toLowerCase()]: {
                          ...papelForm,
                          pesosParcelas: e.target.value,
                        },
                      } as Partial<RegrasRepasseFormState>)
                    }
                    placeholder="1,1,1 ou 1,0,1"
                    className={formControlClass()}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { updatePlano } from "@/actions/planos";
import { CurrencyInput } from "@/components/form/MaskedInputs";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { AdministradoraMini, PlanoRow } from "@/lib/types/domain";
import {
  formatCentavosToCurrencyInput,
  parseCurrencyToCentavos,
} from "@/lib/validators/currency";
import {
  parseRegrasRepasseForm,
  regrasRepasseToForm,
  serializeRegrasRepasse,
  parseRegrasRepasseJson,
} from "@/lib/comissoes/regras-repasse";
import {
  parseRegrasFinanceirasForm,
  RegrasFinanceirasFields,
} from "./RegrasFinanceirasFields";
import { RegrasRepasseFields } from "./RegrasRepasseFields";
import { RegrasFinanceirasPreview } from "./RegrasFinanceirasPreview";

type EditarPlanoFormProps = {
  item: PlanoRow;
  administradoras: AdministradoraMini[];
};

export default function EditarPlanoForm({ item, administradoras }: EditarPlanoFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorTouched, setValorTouched] = useState(false);

  const [form, setForm] = useState({
    administradoraId: item.administradoraId,
    nome: item.nome,
    tipoBem: item.tipoBem,
    valorCredito: formatCentavosToCurrencyInput(item.valorCreditoCentavos),
    percentualComissao: item.percentualComissao?.toString() ?? "",
    parcelasRecebimento: item.parcelasRecebimento?.toString() ?? "3",
    diasParaEstorno: item.diasParaEstorno?.toString() ?? "90",
    regrasRepasse: regrasRepasseToForm(parseRegrasRepasseJson(item.regrasRepasseJson)),
  });

  const valorError = useMemo(() => {
    if (!valorTouched && !form.valorCredito) return null;
    if (!form.valorCredito.trim()) return null;
    try {
      parseCurrencyToCentavos(form.valorCredito);
      return null;
    } catch {
      return "Valor do crédito inválido.";
    }
  }, [form.valorCredito, valorTouched]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setValorTouched(true);
    setSaving(true);
    setError(null);

    if (valorError) {
      setError(valorError);
      setSaving(false);
      return;
    }

    let valorCreditoCentavos: number | null = null;
    try {
      valorCreditoCentavos = form.valorCredito.trim()
        ? parseCurrencyToCentavos(form.valorCredito)
        : null;
    } catch {
      setError("Valor do crédito inválido.");
      setSaving(false);
      return;
    }

    const regras = parseRegrasFinanceirasForm(form);
    if ("error" in regras) {
      setError(regras.error);
      setSaving(false);
      return;
    }

    const regrasRepasse = parseRegrasRepasseForm(form.regrasRepasse);
    if (regrasRepasse && "error" in regrasRepasse) {
      setError(regrasRepasse.error);
      setSaving(false);
      return;
    }

    try {
      await updatePlano(item.id, {
        administradoraId: form.administradoraId,
        nome: form.nome.trim(),
        tipoBem: form.tipoBem.trim(),
        valorCreditoCentavos,
        percentualComissao: regras.percentualComissao,
        parcelasRecebimento: regras.parcelasRecebimento,
        diasParaEstorno: regras.diasParaEstorno,
        regrasRepasseJson:
          regrasRepasse && !("error" in regrasRepasse)
            ? serializeRegrasRepasse(regrasRepasse)
            : null,
      });
      router.push("/planos");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Planos", href: "/planos" },
          { label: "Editar" },
        ]}
        title={item.nome}
        description="Ajuste dados do plano e regras financeiras de comissão."
        actions={
          <Link href="/planos" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />

      <form onSubmit={(e) => void onSave(e)} className={`${panelClass()} p-6`}>
        <div className="text-sm font-medium">Dados do plano</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Administradora <span className="text-red-600"> *</span>
            </div>
            <select
              value={form.administradoraId}
              onChange={(e) => setForm((p) => ({ ...p, administradoraId: e.target.value }))}
              className={formControlClass()}
            >
              {administradoras.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.cnpj})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Nome <span className="text-red-600">*</span>
            </div>
            <input
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-zinc-600">
              Tipo de bem <span className="text-red-600">*</span>
            </div>
            <input
              value={form.tipoBem}
              onChange={(e) => setForm((p) => ({ ...p, tipoBem: e.target.value }))}
              className={formControlClass()}
            />
          </label>
          <div className="md:col-span-2">
            <CurrencyInput
              label="Valor do crédito"
              value={form.valorCredito}
              onChange={(v) => setForm((p) => ({ ...p, valorCredito: v }))}
              error={valorTouched ? valorError : null}
            />
          </div>
        </div>

        <RegrasFinanceirasFields
          form={form}
          onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
        />

        <RegrasRepasseFields
          form={form.regrasRepasse}
          onChange={(patch) =>
            setForm((p) => ({
              ...p,
              regrasRepasse: { ...p.regrasRepasse, ...patch },
            }))
          }
        />

        <RegrasFinanceirasPreview
          form={form}
          valorCreditoCentavos={
            form.valorCredito.trim()
              ? (() => {
                  try {
                    return parseCurrencyToCentavos(form.valorCredito);
                  } catch {
                    return null;
                  }
                })()
              : item.valorCreditoCentavos
          }
        />

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </>
  );
}

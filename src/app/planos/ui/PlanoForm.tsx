"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPlano, updatePlano } from "@/actions/planos";
import { FormField } from "@/components/form/FormField";
import { CurrencyInput } from "@/components/form/MaskedInputs";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { AdministradoraMini, PlanoRow } from "@/lib/types/domain";
import {
  distribuicaoFromPlano,
  EMPTY_DISTRIBUICAO_COMISSAO,
} from "@/lib/planos/distribuicao-comissao-mappers";
import type { DistribuicaoComissaoFormValues } from "@/lib/planos/distribuicao-comissao-schema";
import {
  formatCentavosToCurrencyInput,
  parseCurrencyToCentavos,
} from "@/lib/validators/currency";
import {
  DistribuicaoComissaoFields,
  type DistribuicaoComissaoFormHandle,
} from "./DistribuicaoComissaoFields";
import { RegrasFinanceirasPreview } from "./RegrasFinanceirasPreview";

type FormState = {
  administradoraId: string;
  nome: string;
  tipoBem: string;
  valorCredito: string;
};

type PlanoFormProps =
  | { mode: "create"; administradoras: AdministradoraMini[] }
  | { mode: "edit"; item: PlanoRow; administradoras: AdministradoraMini[] };

function AdministradoraIdFromUrl({
  administradoras,
  onSelect,
}: {
  administradoras: AdministradoraMini[];
  onSelect: (administradoraId: string) => void;
}) {
  const searchParams = useSearchParams();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const urlAdm = searchParams.get("administradoraId");
    if (!urlAdm || !administradoras.some((a) => a.id === urlAdm)) return;
    onSelectRef.current(urlAdm);
  }, [searchParams, administradoras]);

  return null;
}

export default function PlanoForm(props: PlanoFormProps) {
  const { mode, administradoras } = props;
  const router = useRouter();
  const distribuicaoRef = useRef<DistribuicaoComissaoFormHandle>(null);

  const editItem = mode === "edit" ? props.item : null;

  const initialDistribuicao = useMemo(
    () => (editItem ? distribuicaoFromPlano(editItem) : EMPTY_DISTRIBUICAO_COMISSAO),
    [editItem],
  );

  const [form, setForm] = useState<FormState>(() =>
    mode === "edit"
      ? {
          administradoraId: props.item.administradoraId,
          nome: props.item.nome,
          tipoBem: props.item.tipoBem,
          valorCredito: formatCentavosToCurrencyInput(props.item.valorCreditoCentavos),
        }
      : {
          administradoraId: administradoras[0]?.id ?? "",
          nome: "",
          tipoBem: "",
          valorCredito: "",
        },
  );
  const [distribuicao, setDistribuicao] =
    useState<DistribuicaoComissaoFormValues>(initialDistribuicao);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorTouched, setValorTouched] = useState(false);

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

  const valorCreditoCentavos = useMemo(() => {
    if (!form.valorCredito.trim()) return null;
    try {
      return parseCurrencyToCentavos(form.valorCredito);
    } catch {
      return null;
    }
  }, [form.valorCredito]);

  const previewValorCentavos =
    mode === "edit"
      ? (valorCreditoCentavos ?? props.item.valorCreditoCentavos)
      : valorCreditoCentavos;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValorTouched(true);
    setError(null);

    if (valorError) {
      setError(valorError);
      return;
    }

    let parsedValor: number | null = null;
    try {
      parsedValor = form.valorCredito.trim()
        ? parseCurrencyToCentavos(form.valorCredito)
        : null;
    } catch {
      setError("Valor do crédito inválido.");
      return;
    }

    const distribuicaoPayload = await distribuicaoRef.current?.validate();
    if (!distribuicaoPayload) {
      setError("Revise a distribuição de comissões. Há campos inválidos ou somas divergentes.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        administradoraId: form.administradoraId,
        nome: form.nome.trim(),
        tipoBem: form.tipoBem.trim(),
        valorCreditoCentavos: parsedValor,
        percentualComissao: distribuicaoPayload.percentualComissao,
        parcelasRecebimento: distribuicaoPayload.parcelasRecebimento,
        diasParaEstorno: distribuicaoPayload.diasParaEstorno,
        percentuaisRecebimentoJson: distribuicaoPayload.percentuaisRecebimentoJson,
        regrasRepasseJson: distribuicaoPayload.regrasRepasseJson,
      };
      if (mode === "create") {
        await createPlano(payload);
      } else {
        await updatePlano(props.item.id, payload);
      }
      router.push("/planos");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const formBody = (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      {mode === "create" ? (
        <AdministradoraIdFromUrl
          administradoras={administradoras}
          onSelect={(administradoraId) =>
            setForm((p) =>
              p.administradoraId === administradoraId ? p : { ...p, administradoraId },
            )
          }
        />
      ) : null}

      <div className="text-sm font-medium">Dados do plano</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FormField
          label="Administradora"
          htmlFor="plano-administradora"
          required
          className="md:col-span-2"
        >
          <select
            id="plano-administradora"
            value={form.administradoraId}
            onChange={(e) => setForm((p) => ({ ...p, administradoraId: e.target.value }))}
            className={formControlClass()}
            disabled={mode === "create" && administradoras.length === 0}
          >
            {administradoras.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} ({a.cnpj})
              </option>
            ))}
          </select>
          {mode === "create" && administradoras.length === 0 ? (
            <div className="mt-2 text-xs text-muted-foreground">
              Cadastre uma administradora antes de criar um plano.{" "}
              <Link
                href="/administradoras/nova"
                className="font-medium text-foreground/80 underline-offset-2 hover:underline"
              >
                Nova administradora
              </Link>
            </div>
          ) : null}
        </FormField>

        <FormField
          label={mode === "create" ? "Nome do plano" : "Nome"}
          htmlFor="plano-nome"
          required
        >
          <input
            id="plano-nome"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            placeholder={mode === "create" ? "Ex.: Consórcio Imóvel 120x" : undefined}
            className={formControlClass()}
          />
        </FormField>
        <FormField label="Tipo de bem" htmlFor="plano-tipo-bem" required>
          <input
            id="plano-tipo-bem"
            value={form.tipoBem}
            onChange={(e) => setForm((p) => ({ ...p, tipoBem: e.target.value }))}
            placeholder={mode === "create" ? "Ex.: Imóvel, Veículo, Serviço" : undefined}
            className={formControlClass()}
          />
        </FormField>
        <div className="md:col-span-2">
          <CurrencyInput
            label="Valor do crédito"
            value={form.valorCredito}
            onChange={(v) => setForm((p) => ({ ...p, valorCredito: v }))}
            placeholder={mode === "create" ? "0,00" : undefined}
            error={valorTouched ? valorError : null}
          />
        </div>
      </div>

      <DistribuicaoComissaoFields
        key={mode === "edit" ? props.item.id : "novo"}
        ref={distribuicaoRef}
        defaultValues={initialDistribuicao}
        valorCreditoCentavos={previewValorCentavos}
        onValuesChange={setDistribuicao}
      />

      <RegrasFinanceirasPreview
        distribuicao={distribuicao}
        valorCreditoCentavos={previewValorCentavos}
      />

      {error ? (
        <AlertBanner tone="error" className="mt-4">
          {error}
        </AlertBanner>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {mode === "create" ? (
          <button
            type="button"
            onClick={() => router.push("/planos")}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground/70 hover:bg-muted/50"
            disabled={saving}
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          disabled={saving || (mode === "create" && administradoras.length === 0)}
        >
          {saving ? "Salvando..." : mode === "create" ? "Salvar" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );

  if (mode === "edit") {
    return (
      <>
        <PageFlowHeader
          crumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Planos", href: "/planos" },
            { label: props.item.nome },
          ]}
          title={props.item.nome}
          description="Ajuste dados do plano e regras financeiras de comissão."
          actions={
            <Link href="/planos" className={backLinkClass()}>
              Voltar à lista
            </Link>
          }
        />
        {formBody}
      </>
    );
  }

  return formBody;
}

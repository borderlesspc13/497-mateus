"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createAdministradora, updateAdministradora } from "@/actions/administradoras";
import { FormField } from "@/components/form/FormField";
import { CnpjInput } from "@/components/form/MaskedInputs";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import type { AdministradoraRow } from "@/lib/types/domain";
import { isValidCnpj, stripCnpjDigits } from "@/lib/validators/cnpj";

type FormState = {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  contatoPrincipal: string;
  enderecoLogradouro: string;
  enderecoNumero: string;
  enderecoComplemento: string;
  enderecoBairro: string;
  enderecoCidade: string;
  enderecoUf: string;
  enderecoCep: string;
  regrasOperacionaisJson: string;
};

const emptyState: FormState = {
  nome: "",
  cnpj: "",
  telefone: "",
  email: "",
  contatoPrincipal: "",
  enderecoLogradouro: "",
  enderecoNumero: "",
  enderecoComplemento: "",
  enderecoBairro: "",
  enderecoCidade: "",
  enderecoUf: "",
  enderecoCep: "",
  regrasOperacionaisJson: "",
};

function formFromItem(item: AdministradoraRow): FormState {
  return {
    nome: item.nome ?? "",
    cnpj: item.cnpj ?? "",
    telefone: item.telefone ?? "",
    email: item.email ?? "",
    contatoPrincipal: item.contatoPrincipal ?? "",
    enderecoLogradouro: item.enderecoLogradouro ?? "",
    enderecoNumero: item.enderecoNumero ?? "",
    enderecoComplemento: item.enderecoComplemento ?? "",
    enderecoBairro: item.enderecoBairro ?? "",
    enderecoCidade: item.enderecoCidade ?? "",
    enderecoUf: item.enderecoUf ?? "",
    enderecoCep: item.enderecoCep ?? "",
    regrasOperacionaisJson: item.regrasOperacionaisJson ?? "",
  };
}

type AdministradoraFormProps =
  | { mode: "create" }
  | { mode: "edit"; item: AdministradoraRow };

export default function AdministradoraForm(props: AdministradoraFormProps) {
  const { mode } = props;
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    mode === "edit" ? formFromItem(props.item) : emptyState,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cnpjTouched, setCnpjTouched] = useState(false);

  const initialCnpj = mode === "edit" ? props.item.cnpj : "";

  const cnpjError = useMemo(() => {
    if (mode === "create") {
      if (!cnpjTouched && !form.cnpj) return null;
    } else if (!cnpjTouched && form.cnpj === initialCnpj) {
      return null;
    }
    const digits = stripCnpjDigits(form.cnpj);
    if (digits.length === 0) return "Informe o CNPJ.";
    if (digits.length < 14) return "CNPJ incompleto.";
    if (!isValidCnpj(digits)) return "CNPJ inválido.";
    return null;
  }, [form.cnpj, cnpjTouched, mode, initialCnpj]);

  const payload = useMemo(() => {
    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t ? t : null;
    };

    return {
      nome: form.nome.trim(),
      cnpj: form.cnpj,
      telefone: trimOrNull(form.telefone),
      email: trimOrNull(form.email),
      contatoPrincipal: trimOrNull(form.contatoPrincipal),
      enderecoLogradouro: trimOrNull(form.enderecoLogradouro),
      enderecoNumero: trimOrNull(form.enderecoNumero),
      enderecoComplemento: trimOrNull(form.enderecoComplemento),
      enderecoBairro: trimOrNull(form.enderecoBairro),
      enderecoCidade: trimOrNull(form.enderecoCidade),
      enderecoUf: trimOrNull(form.enderecoUf),
      enderecoCep: trimOrNull(form.enderecoCep),
      regrasOperacionaisJson: trimOrNull(form.regrasOperacionaisJson),
    };
  }, [form]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCnpjTouched(true);
    setError(null);

    if (!payload.nome) {
      setError("Informe o nome da administradora.");
      return;
    }
    if (cnpjError) {
      setError(cnpjError);
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await createAdministradora(payload);
      } else {
        await updateAdministradora(props.item.id, payload);
      }
      router.push("/administradoras");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const textInput = (
    id: string,
    label: string,
    key: keyof FormState,
    opts?: { required?: boolean; placeholder?: string },
  ) => (
    <FormField label={label} htmlFor={id} required={opts?.required}>
      <input
        id={id}
        value={form[key]}
        onChange={(e) => {
          const value =
            key === "enderecoUf"
              ? e.target.value.toUpperCase().slice(0, 2)
              : e.target.value;
          setForm((p) => ({ ...p, [key]: value }));
        }}
        placeholder={mode === "create" ? opts?.placeholder : undefined}
        className={formControlClass()}
      />
    </FormField>
  );

  const formBody = (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      <div className="text-sm font-medium">Dados cadastrais</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {textInput("adm-nome", "Nome", "nome", {
          required: true,
          placeholder: "Ex.: Administradora XYZ",
        })}
        <CnpjInput
          value={form.cnpj}
          onChange={(v) => setForm((p) => ({ ...p, cnpj: v }))}
          required
          error={cnpjTouched ? cnpjError : null}
        />
        {textInput("adm-telefone", "Telefone", "telefone", {
          placeholder: "(00) 00000-0000",
        })}
        {textInput("adm-email", "E-mail", "email", {
          placeholder: "contato@empresa.com",
        })}
        {textInput("adm-contato", "Contato principal", "contatoPrincipal", {
          placeholder: "Nome do responsável",
        })}
      </div>

      <div className="mt-8 text-sm font-medium">Endereço</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {textInput("adm-logradouro", "Logradouro", "enderecoLogradouro", {
          placeholder: "Rua / Av.",
        })}
        {textInput("adm-numero", "Número", "enderecoNumero", { placeholder: "123" })}
        {textInput("adm-complemento", "Complemento", "enderecoComplemento", {
          placeholder: "Sala, Andar...",
        })}
        {textInput("adm-bairro", "Bairro", "enderecoBairro", { placeholder: "Centro" })}
        {textInput("adm-cidade", "Cidade", "enderecoCidade", {
          placeholder: "São Paulo",
        })}
        {textInput("adm-uf", "UF", "enderecoUf", { placeholder: "SP" })}
        {textInput("adm-cep", "CEP", "enderecoCep", { placeholder: "00000-000" })}
      </div>

      <div className="mt-8 text-sm font-medium">Regras operacionais</div>
      {mode === "create" ? (
        <div className="mt-2 text-xs text-muted-foreground">
          Por enquanto é um campo livre (texto/JSON). Depois a gente transforma em regras
          estruturadas.
        </div>
      ) : null}
      <textarea
        value={form.regrasOperacionaisJson}
        onChange={(e) => setForm((p) => ({ ...p, regrasOperacionaisJson: e.target.value }))}
        placeholder={mode === "create" ? 'Ex.: {"comissaoPadrao": 0.02}' : undefined}
        className="mt-3 min-h-28 w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
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
            onClick={() => router.push("/administradoras")}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground/70 hover:bg-muted/50"
            disabled={saving}
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          disabled={saving}
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
            { label: "Administradoras", href: "/administradoras" },
            { label: "Editar" },
          ]}
          title={props.item.nome}
          description="Atualize dados cadastrais, contato, endereço e regras operacionais (JSON)."
          actions={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/planos?administradoraId=${encodeURIComponent(props.item.id)}`}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground/70 shadow-sm hover:bg-muted/50"
              >
                Ver planos
              </Link>
              <Link href="/administradoras" className={backLinkClass()}>
                Voltar à lista
              </Link>
            </div>
          }
        />
        {formBody}
      </>
    );
  }

  return formBody;
}

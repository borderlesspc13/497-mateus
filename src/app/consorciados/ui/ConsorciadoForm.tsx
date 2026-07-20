"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createConsorciado,
  getConsorciado,
  updateConsorciado,
  type ConsorciadoInput,
} from "@/actions/consorciados";
import { FormField } from "@/components/form/FormField";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";

type FormState = {
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
};

const emptyState: FormState = {
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  email: "",
};

function validateForm(form: FormState): string | null {
  if (!form.nome.trim()) return "Informe o nome.";
  if (!form.cpf_cnpj.trim()) return "Informe o CPF ou CNPJ.";
  if (!form.telefone.trim()) return "Informe o telefone.";
  if (!form.email.trim()) return "Informe o e-mail.";
  return null;
}

function toInput(form: FormState): ConsorciadoInput {
  return {
    nome: form.nome.trim(),
    cpf_cnpj: form.cpf_cnpj.trim(),
    telefone: form.telefone.trim(),
    email: form.email.trim(),
  };
}

type ConsorciadoFormProps =
  | { mode: "create" }
  | { mode: "edit"; id: string };

export default function ConsorciadoForm(props: ConsorciadoFormProps) {
  const { mode } = props;
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<FormState>(emptyState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const editId = mode === "edit" ? props.id : null;

  useEffect(() => {
    if (!editId) return;
    let alive = true;
    setLoading(true);
    setError(null);
    void getConsorciado(editId)
      .then((item) => {
        if (!alive) return;
        if (!item) {
          setNotFound(true);
          return;
        }
        setForm({
          nome: item.nome,
          cpf_cnpj: item.cpf_cnpj,
          telefone: item.telefone,
          email: item.email,
        });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar consorciado.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [editId]);

  const validationError = useMemo(() => {
    if (!submitted) return null;
    return validateForm(form);
  }, [form, submitted]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);

    const validation = validateForm(form);
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await createConsorciado(toInput(form));
        router.push("/consorciados");
      } else {
        await updateConsorciado(props.id, toInput(form));
        router.push(`/consorciados/${props.id}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (mode === "edit" && loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Carregando consorciado...
      </div>
    );
  }

  if (mode === "edit" && notFound) {
    return (
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Consorciados", href: "/consorciados" },
          { label: "Erro" },
        ]}
        title="Consorciado não encontrado"
        description="Não foi possível carregar este registro."
        actions={
          <Link href="/consorciados" className={backLinkClass()}>
            Voltar à lista
          </Link>
        }
      />
    );
  }

  const formBody = (
    <form onSubmit={(e) => void onSubmit(e)} className={`${panelClass()} p-6`}>
      <div className="text-sm font-medium">Dados do consorciado</div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FormField label="Nome" htmlFor="consorciado-nome" required>
          <input
            id="consorciado-nome"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            placeholder={mode === "create" ? "Nome completo ou razão social" : undefined}
            className={formControlClass()}
          />
        </FormField>
        <FormField label="CPF / CNPJ" htmlFor="consorciado-cpf-cnpj" required>
          <input
            id="consorciado-cpf-cnpj"
            value={form.cpf_cnpj}
            onChange={(e) => setForm((p) => ({ ...p, cpf_cnpj: e.target.value }))}
            placeholder={
              mode === "create" ? "000.000.000-00 ou 00.000.000/0000-00" : undefined
            }
            className={formControlClass()}
          />
        </FormField>
        <FormField label="Telefone" htmlFor="consorciado-telefone" required>
          <input
            id="consorciado-telefone"
            value={form.telefone}
            onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
            placeholder={mode === "create" ? "(00) 00000-0000" : undefined}
            className={formControlClass()}
          />
        </FormField>
        <FormField label="E-mail" htmlFor="consorciado-email" required>
          <input
            id="consorciado-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder={mode === "create" ? "contato@email.com" : undefined}
            className={formControlClass()}
          />
        </FormField>
      </div>

      {validationError || error ? (
        <AlertBanner tone="error" className="mt-4">
          {validationError ?? error}
        </AlertBanner>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {mode === "create" ? (
          <button
            type="button"
            onClick={() => router.push("/consorciados")}
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
            { label: "Consorciados", href: "/consorciados" },
            { label: form.nome || "Editar", href: `/consorciados/${props.id}` },
            { label: "Editar dados" },
          ]}
          title="Editar consorciado"
          description="Atualize os dados cadastrais do consorciado."
          actions={
            <Link href={`/consorciados/${props.id}`} className={backLinkClass()}>
              Voltar à ficha
            </Link>
          }
        />
        {formBody}
      </>
    );
  }

  return formBody;
}

"use client";

import Link from "next/link";
import { ChevronRight, Mail, Pencil, Phone, User } from "lucide-react";
import type { ReactNode } from "react";
import { backLinkClass } from "@/components/page-flow/button-classes";
import { getInitials } from "@/components/app-shell/nav-config";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { SummaryChip } from "@/components/ui/SummaryChip";
import { panelClass, panelInsetClass, secondaryActionClass } from "@/components/ui/list-panel-classes";
import type { ConsorciadoRow, VendaRow } from "@/lib/types/domain";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";

type ConsorciadoFichaHeroProps = {
  consorciado: ConsorciadoRow;
  vendas: VendaRow[];
  editHref: string;
};

function MetaItem({
  icon,
  label,
  value,
  action,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="text-muted-foreground" aria-hidden>
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium text-foreground">{value || "—"}</span>
        {action}
      </div>
    </div>
  );
}

export function ConsorciadoFichaHero({ consorciado, vendas, editHref }: ConsorciadoFichaHeroProps) {
  const inadimplentes = vendas.filter((v) => v.statusOperacional === "INADIMPLENTE").length;
  const inconsistentes = vendas.filter((v) => v.statusInconsistencia === "INCONSISTENTE").length;
  const ativas = vendas.filter((v) => v.statusOperacional === "ATIVO").length;
  const canceladas = vendas.filter((v) => v.statusOperacional === "CANCELADO").length;
  const initials = getInitials(consorciado.nome);

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground"
          aria-label="Trilha de navegação"
        >
          <Link href="/" className="hover:text-foreground hover:underline">
            Dashboard
          </Link>
          <ChevronRight className="size-3 shrink-0" aria-hidden />
          <Link href="/consorciados" className="hover:text-foreground hover:underline">
            Consorciados
          </Link>
          <ChevronRight className="size-3 shrink-0" aria-hidden />
          <span className="font-medium text-foreground">{consorciado.nome}</span>
        </nav>
        <div className="flex flex-wrap gap-2">
          <Link href="/consorciados" className={backLinkClass()}>
            Voltar à consulta
          </Link>
          <Link href={editHref} className={secondaryActionClass()}>
            <Pencil className="mr-1.5 inline size-3.5" aria-hidden />
            Editar dados
          </Link>
        </div>
      </div>

      {inadimplentes > 0 ? (
        <AlertBanner tone="warning" title="Atenção operacional">
          Este consorciado possui {inadimplentes} cota(s) inadimplente(s). Priorize contato e
          registro de atendimento.
        </AlertBanner>
      ) : null}

      <section className={panelClass()}>
        <div className={`py-5 sm:py-6 ${panelInsetClass()}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div
                className="grid size-14 shrink-0 place-items-center rounded-2xl bg-zinc-900 text-lg font-bold text-white shadow-sm sm:size-16 sm:text-xl"
                aria-hidden
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ficha do consorciado
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {consorciado.nome}
                </h1>
                <p className="mt-1 font-mono text-xs text-muted-foreground">ID: {consorciado.id}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <SummaryChip label="Cotas" value={vendas.length} />
              <SummaryChip label="Ativas" value={ativas} tone="green" />
              <SummaryChip label="Inadimplentes" value={inadimplentes} tone="red" />
              <SummaryChip label="Inconsistentes" value={inconsistentes} tone="yellow" />
              {canceladas > 0 ? (
                <SummaryChip label="Canceladas" value={canceladas} />
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetaItem
              icon={<User className="size-3.5" />}
              label="CPF / CNPJ"
              value={consorciado.cpf_cnpj}
            />
            <MetaItem
              icon={<Phone className="size-3.5" />}
              label="Telefone"
              value={consorciado.telefone}
              action={
                <WhatsAppButton telefone={consorciado.telefone} nomeCliente={consorciado.nome} />
              }
            />
            <MetaItem
              icon={<Mail className="size-3.5" />}
              label="E-mail"
              value={consorciado.email}
            />
            <MetaItem
              icon={<User className="size-3.5" />}
              label="Cliente desde"
              value={new Date(consorciado.criadoEm).toLocaleDateString("pt-BR")}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

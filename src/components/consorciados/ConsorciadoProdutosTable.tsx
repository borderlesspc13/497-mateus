"use client";

import { Headphones } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PanelSectionHeader } from "@/components/ui/PanelSectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { panelClass, panelInsetClass, secondaryActionClass } from "@/components/ui/list-panel-classes";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import type { ConsorciadoRow, StatusOperacionalCota, VendaRow } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type ConsorciadoProdutosTableProps = {
  consorciado: ConsorciadoRow;
  vendas: VendaRow[];
  onOpenAtendimento: (venda: VendaRow) => void;
};

const STATUS_ACCENT_BAR: Record<StatusOperacionalCota, string> = {
  ATIVO: "bg-emerald-500",
  INADIMPLENTE: "bg-amber-500",
  CANCELADO: "bg-red-400",
};

function CotaContractCard({
  consorciado,
  venda,
  onOpenAtendimento,
}: {
  consorciado: ConsorciadoRow;
  venda: VendaRow;
  onOpenAtendimento: (venda: VendaRow) => void;
}) {
  const isInconsistente = venda.statusInconsistencia === "INCONSISTENTE";

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50/40">
      <div className="flex min-h-full">
        <div
          className={`w-1.5 shrink-0 ${STATUS_ACCENT_BAR[venda.statusOperacional]}`}
          aria-hidden
        />

        <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:p-6">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => onOpenAtendimento(venda)}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-base font-semibold text-zinc-900">
                Contrato {venda.numeroContrato}
              </span>
              <span className="hidden text-zinc-300 sm:inline" aria-hidden>
                ·
              </span>
              <span className="text-sm font-medium text-zinc-600">
                Grupo {venda.grupo} · Cota {venda.cota}
              </span>
              <span className="flex flex-wrap items-center gap-2 sm:ml-1">
                <StatusBadge status={venda.statusOperacional} />
                {isInconsistente ? <InconsistenciaBadge status="INCONSISTENTE" /> : null}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-zinc-700">
              {venda.plano?.nome ?? "Plano não informado"}
            </p>

            <dl className="mt-4 grid gap-3 text-sm text-zinc-500 sm:grid-cols-3 sm:gap-4">
              <div className="space-y-0.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Administradora
                </dt>
                <dd className="font-medium text-zinc-800">{venda.administradora.nome}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Vencimento
                </dt>
                <dd className="font-medium text-zinc-800">Dia {venda.dataVencimento}</dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">Valor</dt>
                <dd className="font-semibold tabular-nums text-zinc-900">
                  {formatMoneyPtBrFromCentavos(venda.valorCentavos)}
                </dd>
              </div>
            </dl>
          </button>

          <div
            className="flex shrink-0 items-center gap-3 border-t border-zinc-100 pt-4 sm:border-t-0 sm:pt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <WhatsAppButton
              telefone={consorciado.telefone}
              nomeCliente={consorciado.nome}
              numeroContrato={venda.numeroContrato}
              statusOperacional={venda.statusOperacional}
              vendaId={venda.id}
              className="!h-10 !w-10 !rounded-xl"
            />
            <button
              type="button"
              onClick={() => onOpenAtendimento(venda)}
              className={`${secondaryActionClass()} !h-10 gap-2 px-4`}
            >
              <Headphones className="size-4 shrink-0" aria-hidden />
              Atendimento
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ConsorciadoProdutosTable({
  consorciado,
  vendas,
  onOpenAtendimento,
}: ConsorciadoProdutosTableProps) {
  return (
    <section className={panelClass()}>
      <PanelSectionHeader
        title="Produtos e cotas contratadas"
        description={
          vendas.length === 0
            ? "Nenhum produto ou cota vinculado a este consorciado."
            : `${vendas.length} produto(s)/cota(s). Clique no card para abrir o atendimento.`
        }
      />

      {vendas.length === 0 ? (
        <div className={`pb-5 ${panelInsetClass()}`}>
          <EmptyState
            title="Sem produtos contratados"
            description="Quando houver vendas vinculadas a este consorciado, elas aparecerão aqui com status e histórico."
          />
        </div>
      ) : (
        <div className={`space-y-4 pb-6 pt-1 ${panelInsetClass()}`}>
          {vendas.map((venda) => (
            <CotaContractCard
              key={venda.id}
              consorciado={consorciado}
              venda={venda}
              onOpenAtendimento={onOpenAtendimento}
            />
          ))}
        </div>
      )}
    </section>
  );
}

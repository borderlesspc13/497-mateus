"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChipBar, FilterChipButton } from "@/components/ui/FilterChipButton";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PanelSectionHeader } from "@/components/ui/PanelSectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { panelClass, panelInsetClass } from "@/components/ui/list-panel-classes";
import {
  fetchHistoricoAtendimentoForVendas,
  type HistoricoAtendimentoWithVenda,
} from "@/lib/firestore/vendas-historico-client";
import type { VendaRow } from "@/lib/types/domain";
import { TIPO_REGISTRO_LABELS } from "@/lib/vendas/atendimento";

type HistoricoTab = "atendimentos" | "inconsistencias" | "inadimplencias";

type ConsorciadoHistoricoTabsProps = {
  vendas: VendaRow[];
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tipoRegistroClass(tipo: HistoricoAtendimentoWithVenda["tipoRegistro"]) {
  switch (tipo) {
    case "COBRANCA":
      return "border-red-200 bg-red-50 text-red-800";
    case "COBRANCA_WHATSAPP":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "POS_VENDA":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "INCONSISTENCIA":
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function TimelineEntry({ item }: { item: HistoricoAtendimentoWithVenda }) {
  return (
    <li className="relative pl-7 pb-6 last:pb-0">
      <span
        className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-zinc-900 ring-4 ring-white"
        aria-hidden
      />
      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold uppercase tracking-wide",
                tipoRegistroClass(item.tipoRegistro),
              ].join(" ")}
            >
              {TIPO_REGISTRO_LABELS[item.tipoRegistro]}
            </span>
            <span className="text-xs font-medium text-zinc-600">
              Contrato {item.numeroContrato} · Grupo {item.grupo} · Cota {item.cota}
            </span>
          </div>
          <time className="text-xs tabular-nums text-zinc-500" dateTime={item.dataRegistro}>
            {formatDateTime(item.dataRegistro)}
          </time>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
          {item.observacao}
        </p>
      </div>
    </li>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
          <Skeleton className="h-20 flex-1 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function VendaStatusList({
  vendas,
  emptyTitle,
  emptyDescription,
  renderBadge,
}: {
  vendas: VendaRow[];
  emptyTitle: string;
  emptyDescription: string;
  renderBadge: (venda: VendaRow) => ReactNode;
}) {
  if (vendas.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <ul className="space-y-2">
      {vendas.map((venda) => (
        <li
          key={venda.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">
              Contrato {venda.numeroContrato}
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Grupo {venda.grupo} · Cota {venda.cota} · {venda.plano?.nome ?? "Plano não informado"}
            </p>
          </div>
          {renderBadge(venda)}
        </li>
      ))}
    </ul>
  );
}

const TAB_LABELS: Record<HistoricoTab, string> = {
  atendimentos: "Atendimentos",
  inconsistencias: "Inconsistências",
  inadimplencias: "Inadimplências",
};

export function ConsorciadoHistoricoTabs({ vendas }: ConsorciadoHistoricoTabsProps) {
  const [activeTab, setActiveTab] = useState<HistoricoTab>("atendimentos");
  const [historico, setHistorico] = useState<HistoricoAtendimentoWithVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    if (vendas.length === 0) {
      setHistorico([]);
      setLoading(false);
      return;
    }

    void fetchHistoricoAtendimentoForVendas(
      vendas.map((venda) => ({
        id: venda.id,
        numeroContrato: venda.numeroContrato,
        grupo: venda.grupo,
        cota: venda.cota,
      })),
    )
      .then((items) => {
        if (!alive) return;
        setHistorico(items);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar históricos.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [vendas]);

  const inconsistenciaHistorico = useMemo(
    () => historico.filter((item) => item.tipoRegistro === "INCONSISTENCIA"),
    [historico],
  );

  const inadimplenciaHistorico = useMemo(
    () =>
      historico.filter(
        (item) => item.tipoRegistro === "COBRANCA" || item.tipoRegistro === "COBRANCA_WHATSAPP",
      ),
    [historico],
  );

  const vendasInconsistentes = useMemo(
    () => vendas.filter((venda) => venda.statusInconsistencia === "INCONSISTENTE"),
    [vendas],
  );

  const vendasInadimplentes = useMemo(
    () => vendas.filter((venda) => venda.statusOperacional === "INADIMPLENTE"),
    [vendas],
  );

  const tabCounts: Record<HistoricoTab, number> = {
    atendimentos: historico.length,
    inconsistencias: inconsistenciaHistorico.length + vendasInconsistentes.length,
    inadimplencias: inadimplenciaHistorico.length + vendasInadimplentes.length,
  };

  function renderTimeline(items: HistoricoAtendimentoWithVenda[], emptyTitle: string, emptyDescription: string) {
    if (loading) return <TimelineSkeleton />;
    if (error) {
      return <AlertBanner tone="error">{error}</AlertBanner>;
    }
    if (items.length === 0) {
      return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }
    return (
      <ol className="ml-1 border-l border-zinc-200">
        {items.map((item) => (
          <TimelineEntry key={`${item.vendaId}-${item.id}`} item={item} />
        ))}
      </ol>
    );
  }

  return (
    <section className={panelClass()}>
      <PanelSectionHeader
        title="Históricos vinculados"
        description="Timeline consolidada de atendimentos, inconsistências e inadimplências das cotas deste consorciado."
        meta={
          <FilterChipBar>
            {(Object.keys(TAB_LABELS) as HistoricoTab[]).map((tab) => (
              <FilterChipButton
                key={tab}
                active={activeTab === tab}
                count={tabCounts[tab]}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </FilterChipButton>
            ))}
          </FilterChipBar>
        }
      />

      <div className={`py-5 ${panelInsetClass()}`}>
        {activeTab === "atendimentos" ? (
          renderTimeline(
            historico,
            "Nenhum atendimento registrado",
            "Os registros de cobrança, pós-venda e inconsistência aparecerão aqui conforme forem lançados nas cotas.",
          )
        ) : null}

        {activeTab === "inconsistencias" ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Cotas com inconsistência ativa
              </h3>
              <div className="mt-3">
                <VendaStatusList
                  vendas={vendasInconsistentes}
                  emptyTitle="Nenhuma cota inconsistente no momento"
                  emptyDescription="Cotas marcadas como inconsistentes no controle operacional aparecem aqui."
                  renderBadge={(venda) => <InconsistenciaBadge status={venda.statusInconsistencia} />}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Registros de inconsistência
              </h3>
              <div className="mt-3">
                {renderTimeline(
                  inconsistenciaHistorico,
                  "Nenhum registro de inconsistência",
                  "Tratativas de inconsistência lançadas nas cotas aparecerão nesta timeline.",
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "inadimplencias" ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Cotas inadimplentes
              </h3>
              <div className="mt-3">
                <VendaStatusList
                  vendas={vendasInadimplentes}
                  emptyTitle="Nenhuma cota inadimplente no momento"
                  emptyDescription="Cotas com status operacional inadimplente aparecem aqui."
                  renderBadge={(venda) => <StatusBadge status={venda.statusOperacional} />}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Registros de cobrança
              </h3>
              <div className="mt-3">
                {renderTimeline(
                  inadimplenciaHistorico,
                  "Nenhum registro de cobrança",
                  "Interações de cobrança e WhatsApp registradas nas cotas aparecerão nesta timeline.",
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

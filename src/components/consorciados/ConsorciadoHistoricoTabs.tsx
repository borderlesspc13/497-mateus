"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChipBar, FilterChipButton } from "@/components/ui/FilterChipButton";
import { InconsistenciaBadge } from "@/components/ui/InconsistenciaBadge";
import { PanelSectionHeader } from "@/components/ui/PanelSectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { panelClass, panelInsetClass } from "@/components/ui/list-panel-classes";
import {
  addConsorciadoHistoricoAtendimento,
  subscribeConsorciadoHistoricoAtendimento,
} from "@/lib/firestore/consorciados-historico-client";
import {
  fetchHistoricoAtendimentoForVendas,
  type HistoricoAtendimentoWithVenda,
} from "@/lib/firestore/vendas-historico-client";
import type {
  ConsorciadoHistoricoAtendimentoRow,
  ConsorciadoRow,
  VendaRow,
} from "@/lib/types/domain";
import { TIPO_REGISTRO_LABELS } from "@/lib/vendas/atendimento";

type HistoricoTab = "atendimentos" | "inconsistencias" | "inadimplencias";

type ConsorciadoHistoricoTabsProps = {
  consorciado: ConsorciadoRow;
  vendas: VendaRow[];
};

type TimelineItem =
  | {
      kind: "ficha";
      id: string;
      dataRegistro: string;
      observacao: string;
      usuarioNome: string | null;
    }
  | (HistoricoAtendimentoWithVenda & { kind: "cota" });

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

function resolveAutorLabel(user: {
  uid: string;
  displayName: string | null;
  email: string;
} | null): { usuarioId: string; usuarioNome: string } | null {
  if (!user) return null;
  return {
    usuarioId: user.uid,
    usuarioNome: user.displayName?.trim() || user.email || "Usuário",
  };
}

function tipoRegistroClass(tipo: HistoricoAtendimentoWithVenda["tipoRegistro"]) {
  switch (tipo) {
    case "ATENDIMENTO":
      return "border-primary/30 bg-primary/10 text-foreground";
    case "COBRANCA":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    case "COBRANCA_WHATSAPP":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
    case "POS_VENDA":
      return "border-sky-500/30 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300";
    case "INCONSISTENCIA":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
}

function TimelineEntry({ item }: { item: TimelineItem }) {
  const isFicha = item.kind === "ficha";
  const tipoLabel = isFicha ? "Atendimento" : TIPO_REGISTRO_LABELS[item.tipoRegistro];
  const tipoClass = isFicha
    ? "border-primary/30 bg-primary/10 text-foreground"
    : tipoRegistroClass(item.tipoRegistro);
  const contexto = isFicha
    ? "Ficha do consorciado"
    : `Contrato ${item.numeroContrato} · Grupo ${item.grupo} · Cota ${item.cota}`;
  const autor = item.usuarioNome?.trim() || null;

  return (
    <li className="relative pl-7 pb-6 last:pb-0">
      <span
        className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card"
        aria-hidden
      />
      <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold uppercase tracking-wide",
                tipoClass,
              ].join(" ")}
            >
              {tipoLabel}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{contexto}</span>
          </div>
          <time className="text-xs tabular-nums text-muted-foreground" dateTime={item.dataRegistro}>
            {formatDateTime(item.dataRegistro)}
          </time>
        </div>
        {autor ? (
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            Registrado por <span className="text-foreground/80">{autor}</span>
          </p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
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
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="space-y-2">
      {vendas.map((venda) => (
        <li
          key={venda.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Contrato {venda.numeroContrato}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
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

export function ConsorciadoHistoricoTabs({
  consorciado,
  vendas,
}: ConsorciadoHistoricoTabsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<HistoricoTab>("atendimentos");
  const [historicoCotas, setHistoricoCotas] = useState<HistoricoAtendimentoWithVenda[]>([]);
  const [historicoFicha, setHistoricoFicha] = useState<ConsorciadoHistoricoAtendimentoRow[]>([]);
  const [loadingCotas, setLoadingCotas] = useState(true);
  const [loadingFicha, setLoadingFicha] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingCotas(true);
    setError(null);

    if (vendas.length === 0) {
      setHistoricoCotas([]);
      setLoadingCotas(false);
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
        setHistoricoCotas(items);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar históricos.");
      })
      .finally(() => {
        if (!alive) return;
        setLoadingCotas(false);
      });

    return () => {
      alive = false;
    };
  }, [vendas]);

  useEffect(() => {
    setLoadingFicha(true);
    const unsub = subscribeConsorciadoHistoricoAtendimento(
      consorciado.id,
      (items) => {
        setHistoricoFicha(items);
        setLoadingFicha(false);
      },
      (err) => {
        setError(err.message);
        setLoadingFicha(false);
      },
    );
    return unsub;
  }, [consorciado.id]);

  const timelineAtendimentos = useMemo<TimelineItem[]>(() => {
    const fromFicha: TimelineItem[] = historicoFicha.map((item) => ({
      kind: "ficha",
      id: item.id,
      dataRegistro: item.dataRegistro,
      observacao: item.observacao,
      usuarioNome: item.usuarioNome,
    }));
    const fromCotas: TimelineItem[] = historicoCotas.map((item) => ({
      ...item,
      kind: "cota",
    }));
    return [...fromFicha, ...fromCotas].sort((a, b) =>
      b.dataRegistro.localeCompare(a.dataRegistro),
    );
  }, [historicoCotas, historicoFicha]);

  const inconsistenciaHistorico = useMemo(
    () => historicoCotas.filter((item) => item.tipoRegistro === "INCONSISTENCIA"),
    [historicoCotas],
  );

  const inadimplenciaHistorico = useMemo(
    () =>
      historicoCotas.filter(
        (item) => item.tipoRegistro === "COBRANCA" || item.tipoRegistro === "COBRANCA_WHATSAPP",
      ),
    [historicoCotas],
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
    atendimentos: timelineAtendimentos.length,
    inconsistencias: inconsistenciaHistorico.length + vendasInconsistentes.length,
    inadimplencias: inadimplenciaHistorico.length + vendasInadimplentes.length,
  };

  const loading = loadingCotas || loadingFicha;

  async function onAddAtendimento() {
    setFormError(null);
    const autor = resolveAutorLabel(user);
    if (!autor?.usuarioId) {
      setFormError("Faça login novamente para registrar o atendimento.");
      return;
    }

    setSaving(true);
    try {
      await addConsorciadoHistoricoAtendimento(consorciado.id, observacao, autor);
      setObservacao("");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao salvar atendimento.");
    } finally {
      setSaving(false);
    }
  }

  function renderTimeline(
    items: TimelineItem[],
    emptyTitle: string,
    emptyDescription: string,
  ) {
    if (loading) return <TimelineSkeleton />;
    if (error) {
      return <AlertBanner tone="error">{error}</AlertBanner>;
    }
    if (items.length === 0) {
      return <EmptyState title={emptyTitle} description={emptyDescription} />;
    }
    return (
      <ol className="ml-1 border-l border-border">
        {items.map((item) => (
          <TimelineEntry
            key={item.kind === "ficha" ? `ficha-${item.id}` : `cota-${item.vendaId}-${item.id}`}
            item={item}
          />
        ))}
      </ol>
    );
  }

  return (
    <section className={panelClass()}>
      <PanelSectionHeader
        title="Históricos vinculados"
        description="Timeline consolidada de atendimentos da ficha e das cotas deste consorciado."
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
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="text-sm font-semibold text-foreground">Registrar atendimento</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Anote o que foi combinado na ligação ou contato. Seu usuário fica vinculado ao
                registro.
              </p>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: Combinei retorno amanhã às 14h sobre a cota Volkswagen."
                rows={3}
                className="mt-3 w-full resize-y rounded-lg border border-border bg-card p-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              {formError ? (
                <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                  {formError}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => void onAddAtendimento()}
                disabled={saving || !observacao.trim()}
                className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar atendimento"}
              </button>
            </div>

            {renderTimeline(
              timelineAtendimentos,
              "Nenhum atendimento registrado",
              "Registre o primeiro atendimento acima. Interações das cotas também aparecem nesta timeline.",
            )}
          </div>
        ) : null}

        {activeTab === "inconsistencias" ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cotas com inconsistência ativa
              </h3>
              <div className="mt-3">
                <VendaStatusList
                  vendas={vendasInconsistentes}
                  emptyTitle="Nenhuma cota inconsistente no momento"
                  emptyDescription="Cotas marcadas como inconsistentes no controle operacional aparecem aqui."
                  renderBadge={(venda) => (
                    <InconsistenciaBadge status={venda.statusInconsistencia} />
                  )}
                />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Registros de inconsistência
              </h3>
              <div className="mt-3">
                {renderTimeline(
                  inconsistenciaHistorico.map((item) => ({ ...item, kind: "cota" as const })),
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Registros de cobrança
              </h3>
              <div className="mt-3">
                {renderTimeline(
                  inadimplenciaHistorico.map((item) => ({ ...item, kind: "cota" as const })),
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

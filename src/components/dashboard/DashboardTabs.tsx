"use client";

import { useEffect, useState } from "react";
import { getDashboardRanking } from "@/actions/dashboard";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DashboardRankingPanel } from "@/components/dashboard/DashboardRankingPanel";
import type { AppModule } from "@/lib/auth/modules";
import { canAccessModule } from "@/lib/auth/modules";
import type { CampanhaRow, DashboardRanking, DashboardStats } from "@/lib/types/domain";

type DashboardTab = "overview" | "ranking";

type DashboardTabsProps = {
  stats: DashboardStats;
  campanhas: CampanhaRow[];
  permissions: AppModule[];
};

const TABS: { id: DashboardTab; label: string; description: string; requiresMetas?: boolean }[] = [
  {
    id: "overview",
    label: "Visão Geral",
    description: "Vendas, inadimplência e campanhas em andamento.",
  },
  {
    id: "ranking",
    label: "Ranking & Metas",
    description: "Desempenho comercial do mês — top vendedores e melhor equipe.",
    requiresMetas: true,
  },
];

function RankingPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/50 lg:col-span-1" />
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/50 lg:col-span-2" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-muted/50" />
    </div>
  );
}

export function DashboardTabs({ stats, campanhas, permissions }: DashboardTabsProps) {
  const visibleTabs = TABS.filter(
    (tab) =>
      !tab.requiresMetas ||
      canAccessModule(permissions, "metas") ||
      canAccessModule(permissions, "metas-minhas"),
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>(visibleTabs[0]?.id ?? "overview");
  const [ranking, setRanking] = useState<DashboardRanking | null>(null);
  const current = visibleTabs.find((tab) => tab.id === activeTab) ?? visibleTabs[0];

  useEffect(() => {
    if (activeTab !== "ranking" || ranking) return;

    let cancelled = false;

    void getDashboardRanking()
      .then((nextRanking) => {
        if (!cancelled) {
          setRanking(nextRanking);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [activeTab, ranking]);

  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description={current.description}
      />

      <nav
        className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-muted/50 p-1.5"
        aria-label="Separadores do dashboard"
      >
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "inline-flex h-10 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all sm:flex-none sm:min-w-[11rem]",
                isActive
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" ? (
        <DashboardHome stats={stats} campanhas={campanhas} permissions={permissions} />
      ) : !ranking ? (
        <RankingPanelSkeleton />
      ) : (
        <DashboardRankingPanel ranking={ranking} />
      )}
    </>
  );
}

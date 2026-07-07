"use client";

import { useState } from "react";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DashboardRankingPanel } from "@/components/dashboard/DashboardRankingPanel";
import type { AppModule } from "@/lib/auth/modules";
import { canAccessModule } from "@/lib/auth/modules";
import type { DashboardRanking, DashboardStats } from "@/lib/types/domain";

type DashboardTab = "overview" | "ranking";

type DashboardTabsProps = {
  stats: DashboardStats;
  ranking: DashboardRanking;
  permissions: AppModule[];
};

const TABS: { id: DashboardTab; label: string; description: string; requiresMetas?: boolean }[] = [
  {
    id: "overview",
    label: "Visão Geral",
    description: "Indicadores operacionais em tempo real a partir do Firestore.",
  },
  {
    id: "ranking",
    label: "Campanhas & Ranking",
    description: "Metas e desempenho comercial do mês — top vendedores e melhor equipe.",
    requiresMetas: true,
  },
];

export function DashboardTabs({ stats, ranking, permissions }: DashboardTabsProps) {
  const visibleTabs = TABS.filter(
    (tab) =>
      !tab.requiresMetas ||
      canAccessModule(permissions, "metas") ||
      canAccessModule(permissions, "metas-minhas"),
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>(visibleTabs[0]?.id ?? "overview");
  const current = visibleTabs.find((tab) => tab.id === activeTab) ?? visibleTabs[0];

  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description={current.description}
      />

      <nav
        className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-1.5"
        aria-label="Separadores do dashboard"
      >
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-selected={isActive}
              className={[
                "inline-flex h-10 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all sm:flex-none sm:min-w-[11rem]",
                isActive
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                  : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "overview" ? (
        <DashboardHome stats={stats} permissions={permissions} />
      ) : (
        <DashboardRankingPanel ranking={ranking} />
      )}
    </>
  );
}

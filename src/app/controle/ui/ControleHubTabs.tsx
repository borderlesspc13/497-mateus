"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import {
  canAccessModule,
  type AppModule,
  type ControleModule,
} from "@/lib/auth/modules";
import { cn } from "@/lib/utils";

type ControleTab = {
  href: string;
  label: string;
  module: ControleModule;
  description: string;
};

const CONTROLE_TABS: ControleTab[] = [
  {
    href: "/controle/inadimplencia",
    label: "Inadimplência",
    module: "inadimplencia",
    description:
      "Monitore cotas por status operacional. Clique em uma linha para abrir a timeline de atendimento.",
  },
  {
    href: "/controle/inconsistencia",
    label: "Inconsistência",
    module: "inconsistencia",
    description:
      "Priorize cotas marcadas como inconsistentes. Registre tratativas na timeline e altere o status quando resolvido.",
  },
  {
    href: "/controle/pos-venda",
    label: "Pós-venda",
    module: "pos-venda",
    description:
      "Boas-vindas e ativação de vendas recentes ou com pós-venda pendente. Clique em uma linha para abrir a timeline de atendimento.",
  },
];

function isTabActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ControleHubTabs() {
  const pathname = usePathname();
  const { user } = useAuth();
  const permissions = (user?.permissions ?? []) as AppModule[];

  const tabs = CONTROLE_TABS.filter((tab) => canAccessModule(permissions, tab.module));
  const activeTab = tabs.find((tab) => isTabActive(pathname, tab.href)) ?? tabs[0];

  if (tabs.length === 0) return null;

  return (
    <div className="mb-6 space-y-4 sm:mb-8">
      <PageFlowHeader
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Controle", href: "/controle" },
          ...(activeTab ? [{ label: activeTab.label }] : []),
        ]}
        title="Controle"
        description={activeTab?.description}
      />

      <nav
        className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-1.5"
        aria-label="Filas de controle"
      >
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

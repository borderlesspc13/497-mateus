"use client";

import Link from "next/link";
import type { CampanhaRow } from "@/lib/types/domain";
import { panelClass } from "@/components/ui/list-panel-classes";
import { canAccessModule, type AppModule } from "@/lib/auth/modules";

type DashboardCampanhasPanelProps = {
  campanhas: CampanhaRow[];
  permissions: AppModule[];
};

function formatPeriodo(inicio: string, fim: string | null) {
  const start = new Date(inicio);
  const startLabel = Number.isNaN(start.getTime())
    ? "—"
    : start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (!fim) return `Desde ${startLabel}`;
  const end = new Date(fim);
  const endLabel = Number.isNaN(end.getTime())
    ? "—"
    : end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${startLabel} → ${endLabel}`;
}

export function DashboardCampanhasPanel({
  campanhas,
  permissions,
}: DashboardCampanhasPanelProps) {
  const canManage = canAccessModule(permissions, "configuracoes");

  return (
    <section className={`${panelClass()} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Campanhas ativas</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Ações comerciais e operacionais em andamento.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/configuracoes/campanhas"
            className="shrink-0 text-xs font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Gerenciar
          </Link>
        ) : null}
      </div>

      {campanhas.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhuma campanha vigente no momento.
          {canManage ? " Cadastre uma em Configurações → Campanhas." : null}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {campanhas.map((campanha) => (
            <li
              key={campanha.id}
              className={[
                "rounded-xl border px-4 py-3.5",
                campanha.destaque
                  ? "border-amber-300/70 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10"
                  : "border-border bg-muted/30",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{campanha.titulo}</h3>
                {campanha.destaque ? (
                  <span className="rounded-full border border-amber-400/50 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                    Destaque
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                {campanha.descricao}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {formatPeriodo(campanha.dataInicio, campanha.dataFim)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { panelClass } from "@/components/ui/list-panel-classes";
import type { DashboardRanking, DashboardVendedorRanking } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type DashboardRankingPanelProps = {
  ranking: DashboardRanking;
};

const MEDAL_STYLES = [
  {
    ring: "ring-amber-300/60",
    bg: "bg-gradient-to-br from-amber-50 to-amber-100",
    icon: "text-amber-600",
    label: "1º",
  },
  {
    ring: "ring-zinc-300/60",
    bg: "bg-gradient-to-br from-zinc-50 to-zinc-100",
    icon: "text-zinc-500",
    label: "2º",
  },
  {
    ring: "ring-orange-300/50",
    bg: "bg-gradient-to-br from-orange-50 to-amber-50",
    icon: "text-orange-700",
    label: "3º",
  },
] as const;

function IconTrophy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM5 4H3v2a3 3 0 003 3M19 4h2v2a3 3 0 01-3 3" />
    </svg>
  );
}

function IconMedal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="9" r="5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14.5L7 21l5-2.5L17 21l-1.5-6.5" />
    </svg>
  );
}

function IconUsersTeam({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7zM16 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function VendedorRankCard({
  vendedor,
  position,
  maxCredito,
}: {
  vendedor: DashboardVendedorRanking;
  position: number;
  maxCredito: number;
}) {
  const medal = MEDAL_STYLES[position - 1];
  const progress = maxCredito > 0 ? Math.round((vendedor.creditoCentavos / maxCredito) * 100) : 0;

  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        medal ? `ring-2 ${medal.ring}` : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl border",
            medal ? medal.bg : "border-zinc-200 bg-zinc-50",
          ].join(" ")}
        >
          {medal ? (
            <IconMedal className={`h-6 w-6 ${medal.icon}`} />
          ) : (
            <span className="text-sm font-bold text-zinc-600">{position}º</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {medal ? (
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {medal.label} lugar
              </span>
            ) : null}
            <h3 className="truncate text-base font-semibold text-zinc-900">{vendedor.nome}</h3>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Equipe <span className="font-medium text-zinc-700">{vendedor.equipeNome}</span>
            {" · "}
            {vendedor.quantidadeVendas} venda{vendedor.quantidadeVendas === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-lg font-bold tabular-nums tracking-tight text-zinc-900">
            {formatMoneyPtBrFromCentavos(vendedor.creditoCentavos)}
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={[
            "h-full rounded-full transition-all",
            position === 1 ? "bg-amber-500" : position === 2 ? "bg-zinc-400" : position === 3 ? "bg-orange-400" : "bg-zinc-300",
          ].join(" ")}
          style={{ width: `${Math.max(progress, vendedor.creditoCentavos > 0 ? 6 : 0)}%` }}
        />
      </div>
    </article>
  );
}

export function DashboardRankingPanel({ ranking }: DashboardRankingPanelProps) {
  const maxCredito = ranking.topVendedores[0]?.creditoCentavos ?? 1;
  const hasData = ranking.topVendedores.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <section
          className={[
            panelClass(),
            "relative overflow-hidden border-t-[3px] border-t-amber-500 p-6 lg:col-span-1",
          ].join(" ")}
        >
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-100/60 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
                <IconTrophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Melhor equipe
                </p>
                <h2 className="text-lg font-semibold capitalize text-zinc-900">{ranking.mesLabel}</h2>
              </div>
            </div>

            {ranking.melhorEquipe ? (
              <div className="mt-6">
                <p className="text-2xl font-bold text-zinc-900">{ranking.melhorEquipe.nome}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-amber-700">
                  {formatMoneyPtBrFromCentavos(ranking.melhorEquipe.creditoCentavos)}
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  {ranking.melhorEquipe.quantidadeVendas} venda
                  {ranking.melhorEquipe.quantidadeVendas === 1 ? "" : "s"} ativa
                  {ranking.melhorEquipe.quantidadeVendas === 1 ? "" : "s"} no mês
                </p>
                <Link
                  href="/configuracoes/equipes"
                  className="mt-4 inline-flex text-xs font-semibold text-amber-800 underline-offset-4 hover:underline"
                >
                  Ver equipes →
                </Link>
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Sem vendas no mês"
                  description="Ainda não há vendas ativas registradas neste período."
                />
              </div>
            )}
          </div>
        </section>

        <section className={`${panelClass()} p-6 lg:col-span-2`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Top 5 vendedores do mês</h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                Ranking por volume de crédito vendido em vendas com status Ativo (
                <span className="capitalize">{ranking.mesLabel}</span>).
              </p>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600">
              <IconMedal className="h-5 w-5" />
            </div>
          </div>

          {!hasData ? (
            <div className="mt-6">
              <EmptyState
                title="Ranking vazio"
                description="Registre vendas ativas com data no mês corrente para alimentar o ranking."
                action={
                  <Link
                    href="/vendas/nova"
                    className="inline-flex h-11 items-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Nova venda
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {ranking.topVendedores.map((vendedor, index) => (
                <VendedorRankCard
                  key={vendedor.id}
                  vendedor={vendedor}
                  position={index + 1}
                  maxCredito={maxCredito}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {ranking.topEquipes.length > 1 ? (
        <section className={`${panelClass()} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Ranking por equipe</h2>
              <p className="mt-1.5 text-sm text-zinc-600">
                Comparativo de crédito comercializado entre equipes no mês.
              </p>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
              <IconUsersTeam className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {ranking.topEquipes.map((equipe, index) => {
              const maxEquipe = ranking.topEquipes[0]?.creditoCentavos ?? 1;
              const pct = Math.round((equipe.creditoCentavos / maxEquipe) * 100);
              return (
                <div key={equipe.id}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-700">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-zinc-900">{equipe.nome}</span>
                    </div>
                    <span className="tabular-nums text-zinc-500">
                      {equipe.quantidadeVendas} venda{equipe.quantidadeVendas === 1 ? "" : "s"} ·{" "}
                      {formatMoneyPtBrFromCentavos(equipe.creditoCentavos)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all"
                      style={{ width: `${Math.max(pct, equipe.creditoCentavos > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

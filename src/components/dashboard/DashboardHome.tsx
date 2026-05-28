import Link from "next/link";
import type { ReactNode } from "react";
import { PageFlowHeader } from "@/components/page-flow/PageFlowHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  dataTableClass,
  panelClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { DashboardStats } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type DashboardHomeProps = {
  stats: DashboardStats;
};

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  href?: string;
  linkLabel?: string;
  accent?: "default" | "muted";
};

function KpiCard({ label, value, hint, icon, href, linkLabel, accent = "default" }: KpiCardProps) {
  const isMuted = accent === "muted";

  const content = (
    <div className="flex flex-col items-center px-2 py-2 text-center">
      <div
        className={[
          "grid h-14 w-14 place-items-center rounded-2xl border shadow-sm",
          isMuted
            ? "border-dashed border-zinc-300 bg-zinc-50 text-zinc-400"
            : "border-zinc-200 bg-zinc-50 text-zinc-700",
        ].join(" ")}
      >
        {icon}
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div
        className={[
          "mt-2 tabular-nums tracking-tight",
          isMuted
            ? "text-3xl font-bold text-zinc-400"
            : "text-4xl font-bold text-zinc-900 sm:text-5xl",
        ].join(" ")}
      >
        {value}
      </div>
      <p className="mt-3 max-w-[16rem] text-sm leading-6 text-zinc-600">{hint}</p>
      {href && linkLabel ? (
        <span className="mt-4 text-xs font-semibold text-zinc-900 underline-offset-4 group-hover:underline">
          {linkLabel} →
        </span>
      ) : null}
    </div>
  );

  const cardClass = [
    "rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200",
    isMuted
      ? "border-dashed border-zinc-300 hover:border-zinc-400 hover:shadow-md"
      : "border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={`group ${cardClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400`}>
        {content}
      </Link>
    );
  }

  return <div className={cardClass}>{content}</div>;
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-12L6 6zM6 6l-2-2H2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  );
}

function IconCurrency() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H7" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    </svg>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

export function DashboardHome({ stats }: DashboardHomeProps) {
  const maxMesValor = Math.max(...stats.vendasPorMes.map((m) => m.valorCentavos), 1);
  const maxMesQtd = Math.max(...stats.vendasPorMes.map((m) => m.quantidade), 1);

  const statusRows = [
    { label: "Ativas", count: stats.nVendasAtivas, tone: "bg-emerald-500" },
    { label: "Inadimplentes", count: stats.nVendasInadimplentes, tone: "bg-amber-500" },
    { label: "Canceladas", count: stats.nVendasCanceladas, tone: "bg-red-400" },
  ];

  const taxaAtivas =
    stats.nVendas > 0 ? Math.round((stats.nVendasAtivas / stats.nVendas) * 100) : 0;

  return (
    <>
      <PageFlowHeader
        crumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description="Visão geral do sistema: cadastros, volume de vendas, valores e tendência dos últimos meses."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Consorciados"
          value={String(stats.nConsorciados)}
          hint="Base cadastral do CRM operacional."
          icon={<IconUsers />}
          href="/consorciados"
          linkLabel="Ver cadastro"
        />
        <KpiCard
          label="Administradoras"
          value={String(stats.nAdministradoras)}
          hint="Parceiros e regras por administradora."
          icon={<IconBuilding />}
          href="/administradoras"
          linkLabel="Ver cadastro"
        />
        <KpiCard
          label="Planos"
          value={String(stats.nPlanos)}
          hint="Produtos vinculados às administradoras."
          icon={<IconLayers />}
          href="/planos"
          linkLabel="Ver cadastro"
        />
        <KpiCard
          label="Vendas"
          value={String(stats.nVendas)}
          hint={`${stats.nVendasAtivas} ativas · ${taxaAtivas}% da carteira`}
          icon={<IconCart />}
          href="/vendas"
          linkLabel="Ver todas"
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Valor total"
          value={formatMoneyPtBrFromCentavos(stats.valorTotalCentavos)}
          hint={`Ativas: ${formatMoneyPtBrFromCentavos(stats.valorAtivasCentavos)}`}
          icon={<IconCurrency />}
        />
        <KpiCard
          label="Ticket médio"
          value={formatMoneyPtBrFromCentavos(stats.ticketMedioCentavos)}
          hint="Média das vendas com valor informado."
          icon={<IconChart />}
        />
        <KpiCard
          label="Comissões"
          value="Em breve"
          hint="Próxima etapa: extratos e relatórios a partir dos planos cadastrados."
          icon={<IconSpark />}
          accent="muted"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className={`${panelClass()} p-6 lg:col-span-2`}>
          <SectionTitle
            title="Vendas nos últimos 6 meses"
            description="Quantidade e valor por mês (data da venda ou cadastro)."
          />

          <div className="mt-8 space-y-5">
            {stats.vendasPorMes.map((mes) => {
              const valorPct = Math.round((mes.valorCentavos / maxMesValor) * 100);
              const qtdPct = Math.round((mes.quantidade / maxMesQtd) * 100);
              return (
                <div key={mes.key}>
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold capitalize text-zinc-800">{mes.label}</span>
                    <span className="tabular-nums text-zinc-500">
                      {mes.quantidade} venda{mes.quantidade === 1 ? "" : "s"} ·{" "}
                      {formatMoneyPtBrFromCentavos(mes.valorCentavos)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-900 transition-all"
                        style={{ width: `${Math.max(valorPct, mes.valorCentavos > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-zinc-400 transition-all"
                        style={{ width: `${Math.max(qtdPct, mes.quantidade > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-5 text-xs font-medium text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-7 rounded-full bg-zinc-900" />
              Valor (R$)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-7 rounded-full bg-zinc-400" />
              Quantidade
            </span>
          </div>
        </section>

        <section className={`${panelClass()} p-6`}>
          <SectionTitle
            title="Vendas por status"
            description="Distribuição do pipeline comercial."
          />

          <div className="mt-8 space-y-5">
            {statusRows.map((row) => {
              const pct = stats.nVendas > 0 ? Math.round((row.count / stats.nVendas) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-800">{row.label}</span>
                    <span className="tabular-nums text-zinc-500">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full ${row.tone}`}
                      style={{ width: `${Math.max(pct, row.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className={`${panelClass()} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <SectionTitle
              title="Vendas recentes"
              description="Últimas movimentações registradas."
            />
            <Link
              href="/vendas"
              className="shrink-0 text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {stats.vendasRecentes.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhuma venda cadastrada"
                description="Registre a primeira venda para acompanhar o pipeline comercial."
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
            <div className={`${tableWrapClass()} mt-6`}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Título</th>
                    <th className={tableHeadCellClass()}>Status</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                    <th className={tableHeadCellClass()}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.vendasRecentes.map((v, index) => (
                    <tr key={v.id} className={tableRowClass(index)}>
                      <td className={tableCellClass()}>
                        <Link
                          href={`/vendas/${v.id}`}
                          className="font-semibold text-zinc-900 underline-offset-2 hover:underline"
                        >
                          {v.titulo}
                        </Link>
                        <div className="mt-0.5 text-xs text-zinc-500">
                          {v.consorciadoNome ?? "Sem consorciado"} · {v.administradoraNome}
                        </div>
                      </td>
                      <td className={tableCellClass()}>
                        <StatusBadge status={v.status} />
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap tabular-nums font-medium`}>
                        {formatMoneyPtBrFromCentavos(v.valorCentavos)}
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap`}>
                        {formatDate(v.dataVenda ?? null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`${panelClass()} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <SectionTitle
              title="Top administradoras"
              description="Ranking por volume e valor de vendas."
            />
            <Link
              href="/administradoras"
              className="shrink-0 text-xs font-semibold text-zinc-900 underline-offset-4 hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {stats.vendasPorAdministradora.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Sem dados de ranking"
                description="Cadastre administradoras e vendas para ver o ranking por parceiro."
              />
            </div>
          ) : (
            <div className={`${tableWrapClass()} mt-6`}>
              <table className={dataTableClass()}>
                <thead>
                  <tr>
                    <th className={tableHeadCellClass()}>Administradora</th>
                    <th className={tableHeadCellClass()}>Vendas</th>
                    <th className={tableHeadCellClass()}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.vendasPorAdministradora.map((adm, index) => (
                    <tr key={adm.id} className={tableRowClass(index)}>
                      <td className={tableCellClass()}>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-700">
                            {index + 1}
                          </span>
                          <Link
                            href={`/administradoras/${adm.id}`}
                            className="font-semibold text-zinc-900 underline-offset-2 hover:underline"
                          >
                            {adm.nome}
                          </Link>
                        </div>
                      </td>
                      <td className={`${tableCellClass()} tabular-nums font-medium`}>
                        {adm.quantidade}
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap tabular-nums font-medium`}>
                        {formatMoneyPtBrFromCentavos(adm.valorCentavos)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardCampanhasPanel } from "@/components/dashboard/DashboardCampanhasPanel";
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
import { canAccessModule, type AppModule } from "@/lib/auth/modules";
import type { CampanhaRow, DashboardStats } from "@/lib/types/domain";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";

type DashboardHomeProps = {
  stats: DashboardStats;
  campanhas: CampanhaRow[];
  permissions: AppModule[];
};

type KpiTone = "emerald" | "sky" | "violet" | "amber" | "rose" | "zinc";

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  href?: string;
  linkLabel?: string;
  tone?: KpiTone;
  muted?: boolean;
};

const KPI_TONE_STYLES: Record<
  KpiTone,
  { border: string; icon: string; link: string }
> = {
  emerald: {
    border: "border-t-emerald-500",
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600",
    link: "text-emerald-700 group-hover:text-emerald-800",
  },
  sky: {
    border: "border-t-sky-500",
    icon: "border-sky-100 bg-sky-50 text-sky-600",
    link: "text-sky-700 group-hover:text-sky-800",
  },
  violet: {
    border: "border-t-violet-500",
    icon: "border-violet-100 bg-violet-50 text-violet-600",
    link: "text-violet-700 group-hover:text-violet-800",
  },
  amber: {
    border: "border-t-amber-500",
    icon: "border-amber-100 bg-amber-50 text-amber-600",
    link: "text-amber-700 group-hover:text-amber-800",
  },
  rose: {
    border: "border-t-rose-500",
    icon: "border-rose-100 bg-rose-50 text-rose-600",
    link: "text-rose-700 group-hover:text-rose-800",
  },
  zinc: {
    border: "border-t-zinc-400",
    icon: "border-border bg-muted/50 text-muted-foreground",
    link: "text-foreground/70 group-hover:text-foreground",
  },
};

function getValueTextClass(value: string, muted: boolean): string {
  const length = value.length;

  if (muted) {
    if (length > 12) return "text-lg font-semibold";
    if (length > 8) return "text-xl font-semibold";
    return "text-2xl font-semibold";
  }

  if (length > 14) return "text-lg font-bold";
  if (length > 10) return "text-xl font-bold";
  if (length > 6) return "text-2xl font-bold";
  return "text-3xl font-bold";
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  href,
  linkLabel,
  tone = "zinc",
  muted = false,
}: KpiCardProps) {
  const styles = KPI_TONE_STYLES[tone];
  const valueClass = getValueTextClass(value, muted);
  const isCurrency = value.startsWith("R$");

  const content = (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p
            className={[
              "mt-2.5 max-w-full tabular-nums tracking-tight",
              isCurrency ? "break-words leading-tight" : "overflow-hidden text-ellipsis whitespace-nowrap leading-none",
              valueClass,
              muted ? "text-muted-foreground" : "text-foreground",
            ].join(" ")}
            title={value}
          >
            {value}
          </p>
        </div>
        <div
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl border",
            muted ? "border-dashed border-border bg-muted/50 text-muted-foreground" : styles.icon,
          ].join(" ")}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">{hint}</p>

      {href && linkLabel ? (
        <span
          className={[
            "mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold transition-colors",
            styles.link,
          ].join(" ")}
        >
          {linkLabel}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      ) : (
        <span className="mt-auto block pt-4" aria-hidden />
      )}
    </div>
  );

  const cardClass = [
    "group relative flex min-h-[11.5rem] min-w-0 overflow-hidden rounded-2xl border border-border/90 border-t-[3px] bg-card p-5 shadow-sm transition-all duration-200",
    muted ? "border-dashed hover:border-border" : styles.border,
    href
      ? "hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      : "hover:shadow-md",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }

  return <article className={cardClass}>{content}</article>;
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-12L6 6zM6 6l-2-2H2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  );
}

function IconCurrency() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H7" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16M8 17V9M12 17V7M16 17v-4" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5" aria-hidden>
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
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function DashboardHome({ stats, campanhas, permissions }: DashboardHomeProps) {
  const maxMesValor = Math.max(...stats.vendasPorMes.map((m) => m.valorCentavos), 1);
  const maxMesQtd = Math.max(...stats.vendasPorMes.map((m) => m.quantidade), 1);
  const showComissoes = canAccessModule(permissions, "comissoes");
  const showInadimplencia = canAccessModule(permissions, "inadimplencia");
  const showInconsistencia = canAccessModule(permissions, "inconsistencia");
  const showPosVenda = canAccessModule(permissions, "pos-venda");
  const showVendas = canAccessModule(permissions, "vendas");
  const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const statusRows = [
    { label: "Ativas", count: stats.nVendasAtivas, tone: "bg-emerald-500" },
    { label: "Inadimplentes", count: stats.nVendasInadimplentes, tone: "bg-amber-500" },
    { label: "Canceladas", count: stats.nVendasCanceladas, tone: "bg-red-400" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
        <KpiCard
          label="Vendas realizadas"
          value={String(stats.nVendas)}
          hint={`${stats.nVendasAtivas} ativas na carteira`}
          icon={<IconCart />}
          href={showVendas ? "/vendas" : undefined}
          linkLabel={showVendas ? "Ver vendas" : undefined}
          tone="emerald"
        />
        <KpiCard
          label="Inadimplência atual"
          value={String(stats.nVendasInadimplentes)}
          hint="Cotas com status Inadimplente."
          icon={<IconChart />}
          href={showInadimplencia ? "/controle/inadimplencia" : undefined}
          linkLabel={showInadimplencia ? "Ver inadimplência" : undefined}
          tone="amber"
          muted={!showInadimplencia}
        />
        <KpiCard
          label="Crédito comercializado"
          value={formatMoneyPtBrFromCentavos(stats.valorCreditoComercializadoCentavos)}
          hint="Soma dos valores das vendas ativas."
          icon={<IconCurrency />}
          tone="sky"
        />
        <KpiCard
          label="Comissões pagas"
          value={formatMoneyPtBrFromCentavos(stats.comissoesPagasMesCentavos)}
          hint={`Extratos com status Pago em ${mesAtual}.`}
          icon={<IconSpark />}
          href={showComissoes ? "/comissoes" : undefined}
          linkLabel={showComissoes ? "Ver extratos" : undefined}
          tone="violet"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Vendas ativas"
          value={String(stats.nVendasAtivas)}
          hint="Cotas com status operacional Ativo."
          icon={<IconCart />}
          href={showVendas ? "/vendas" : undefined}
          linkLabel={showVendas ? "Ver vendas" : undefined}
          tone="emerald"
        />
        <KpiCard
          label="Inconsistências"
          value={String(stats.nVendasInconsistentes)}
          hint="Cotas marcadas como inconsistentes."
          icon={<IconChart />}
          href={showInconsistencia ? "/controle/inconsistencia" : undefined}
          linkLabel={showInconsistencia ? "Ver inconsistência" : undefined}
          tone="rose"
          muted={!showInconsistencia}
        />
        <KpiCard
          label="Pós-venda pendente"
          value={String(stats.nVendasPosVendaPendentes)}
          hint="Cotas aguardando pós-venda."
          icon={<IconSpark />}
          href={showPosVenda ? "/controle/pos-venda" : undefined}
          linkLabel={showPosVenda ? "Ver pós-venda" : undefined}
          tone="sky"
          muted={!showPosVenda}
        />
      </div>

      <div className="mt-6">
        <DashboardCampanhasPanel campanhas={campanhas} permissions={permissions} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <KpiCard
          label="Valor total (carteira)"
          value={formatMoneyPtBrFromCentavos(stats.valorTotalCentavos)}
          hint={`Ativas: ${formatMoneyPtBrFromCentavos(stats.valorAtivasCentavos)}`}
          icon={<IconCurrency />}
          tone="sky"
        />
        <KpiCard
          label="Ticket médio"
          value={formatMoneyPtBrFromCentavos(stats.ticketMedioCentavos)}
          hint="Média das vendas com valor informado."
          icon={<IconChart />}
          tone="violet"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        <section className={`${panelClass()} p-5 sm:p-6 xl:col-span-3`}>
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
                    <span className="font-semibold capitalize text-foreground/80">{mes.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {mes.quantidade} venda{mes.quantidade === 1 ? "" : "s"} ·{" "}
                      {formatMoneyPtBrFromCentavos(mes.valorCentavos)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(valorPct, mes.valorCentavos > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
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

          <div className="mt-6 flex flex-wrap gap-5 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-7 rounded-full bg-primary" />
              Valor (R$)
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-7 rounded-full bg-zinc-400" />
              Quantidade
            </span>
          </div>
        </section>

        <section className={`${panelClass()} p-5 sm:p-6 xl:col-span-2`}>
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
                    <span className="font-medium text-foreground/80">{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
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

      <section className={`${panelClass()} mt-8`}>
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <SectionTitle
            title="Vendas recentes"
            description="Últimas movimentações registradas."
          />
          {showVendas ? (
            <Link
              href="/vendas"
              className="shrink-0 text-xs font-semibold text-foreground underline-offset-4 hover:underline"
            >
              Ver todas
            </Link>
          ) : null}
        </div>

        {stats.vendasRecentes.length === 0 ? (
          <div className="px-5 pb-5 sm:px-6">
            <EmptyState
              title="Nenhuma venda cadastrada"
              description="Registre a primeira venda para acompanhar o pipeline comercial."
              action={
                showVendas ? (
                  <Link
                    href="/vendas/nova"
                    className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Nova venda
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className={`${tableWrapClass()} pb-2`}>
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
                        className="font-semibold text-foreground underline-offset-2 hover:underline"
                      >
                        {v.titulo}
                      </Link>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {v.consorciadoNome ?? "Sem consorciado"} · {v.administradoraNome}
                      </div>
                    </td>
                    <td className={tableCellClass()}>
                      <StatusBadge status={v.statusOperacional} />
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
    </>
  );
}

import type { ExtratoStatus } from "@/lib/types/domain";

const STATUS_CONFIG: Record<
  ExtratoStatus,
  { label: string; className: string }
> = {
  PENDENTE: {
    label: "Pendente",
    className: "border-border bg-muted text-muted-foreground",
  },
  RECEBIDO: {
    label: "Recebido",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  },
  LIBERADO: {
    label: "Liberado",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300",
  },
  PAGO: {
    label: "Pago",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
};

type ExtratoStatusBadgeProps = {
  status: ExtratoStatus;
};

export function ExtratoStatusBadge({ status }: ExtratoStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold tracking-wide",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}

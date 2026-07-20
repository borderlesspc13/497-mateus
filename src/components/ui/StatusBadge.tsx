import type { StatusOperacionalCota } from "@/lib/types/domain";

const STATUS_CONFIG: Record<
  StatusOperacionalCota,
  { label: string; className: string }
> = {
  ATIVO: {
    label: "Ativo",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
  INADIMPLENTE: {
    label: "Inadimplente",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  CANCELADO: {
    label: "Cancelado",
    className:
      "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300",
  },
};

type StatusBadgeProps = {
  status: StatusOperacionalCota;
};

export function StatusBadge({ status }: StatusBadgeProps) {
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

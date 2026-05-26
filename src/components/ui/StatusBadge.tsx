import type { VendaStatus } from "@/lib/types/domain";

const STATUS_CONFIG: Record<
  VendaStatus,
  { label: string; className: string }
> = {
  FECHADA: {
    label: "Fechada",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  ENVIADA: {
    label: "Enviada",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  RASCUNHO: {
    label: "Rascunho",
    className: "border-zinc-200 bg-zinc-100 text-zinc-700",
  },
  CANCELADA: {
    label: "Cancelada",
    className: "border-red-200 bg-red-50 text-red-800",
  },
};

type StatusBadgeProps = {
  status: VendaStatus;
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

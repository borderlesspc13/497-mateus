import type { ExtratoStatus } from "@/lib/types/domain";

const STATUS_CONFIG: Record<
  ExtratoStatus,
  { label: string; className: string }
> = {
  PENDENTE: {
    label: "Pendente",
    className: "border-zinc-200 bg-zinc-100 text-zinc-700",
  },
  LIBERADO: {
    label: "Liberado",
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
  PAGO: {
    label: "Pago",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
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

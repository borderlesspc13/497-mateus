import type { StatusInconsistencia } from "@/lib/types/domain";
import { STATUS_INCONSISTENCIA_LABELS } from "@/lib/vendas/atendimento";

const CONFIG: Record<StatusInconsistencia, { label: string; className: string }> = {
  CONSISTENTE: {
    label: STATUS_INCONSISTENCIA_LABELS.CONSISTENTE,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
  INCONSISTENTE: {
    label: STATUS_INCONSISTENCIA_LABELS.INCONSISTENTE,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
};

type InconsistenciaBadgeProps = {
  status: StatusInconsistencia;
};

export function InconsistenciaBadge({ status }: InconsistenciaBadgeProps) {
  const config = CONFIG[status];
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

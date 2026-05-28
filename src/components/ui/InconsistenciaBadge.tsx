import type { StatusInconsistencia } from "@/lib/types/domain";
import { STATUS_INCONSISTENCIA_LABELS } from "@/lib/vendas/atendimento";

const CONFIG: Record<StatusInconsistencia, { label: string; className: string }> = {
  CONSISTENTE: {
    label: STATUS_INCONSISTENCIA_LABELS.CONSISTENTE,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  INCONSISTENTE: {
    label: STATUS_INCONSISTENCIA_LABELS.INCONSISTENTE,
    className: "border-amber-200 bg-amber-50 text-amber-800",
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

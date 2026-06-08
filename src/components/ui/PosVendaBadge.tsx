import type { StatusPosVenda } from "@/lib/types/domain";
import { STATUS_POS_VENDA_LABELS } from "@/lib/vendas/pos-venda";

const CONFIG: Record<StatusPosVenda, { label: string; className: string }> = {
  PENDENTE: {
    label: STATUS_POS_VENDA_LABELS.PENDENTE,
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  FEITO: {
    label: STATUS_POS_VENDA_LABELS.FEITO,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

type PosVendaBadgeProps = {
  status: StatusPosVenda;
};

export function PosVendaBadge({ status }: PosVendaBadgeProps) {
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

import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";
import type { ExportValueFormat } from "@/lib/export/types";
import type { ExtratoStatus, StatusOperacionalCota } from "@/lib/types/domain";
import { STATUS_INCONSISTENCIA_LABELS } from "@/lib/vendas/atendimento";
import { STATUS_POS_VENDA_LABELS } from "@/lib/vendas/pos-venda";

export const STATUS_OPERACIONAL_LABELS: Record<StatusOperacionalCota, string> = {
  ATIVO: "Ativo",
  INADIMPLENTE: "Inadimplente",
  CANCELADO: "Cancelado",
};

export const EXTRATO_STATUS_LABELS: Record<ExtratoStatus, string> = {
  PENDENTE: "Pendente",
  RECEBIDO: "Recebido",
  LIBERADO: "Liberado",
  PAGO: "Pago",
};

export const EXTRATO_TIPO_LABELS: Record<string, string> = {
  COMISSAO: "Comissão",
  ESTORNO: "Estorno",
};

export { STATUS_INCONSISTENCIA_LABELS, STATUS_POS_VENDA_LABELS };

export function formatExportDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

export function formatExportPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`;
}

export function formatExportCurrencyCentavos(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return formatMoneyPtBrFromCentavos(value);
}

export function formatExportCellValue(
  raw: string | number | boolean | null | undefined,
  format: ExportValueFormat = "text",
  statusLabels?: Record<string, string>,
): string | number {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "boolean") return raw ? "Sim" : "Não";

  switch (format) {
    case "currency":
      return typeof raw === "number" ? formatExportCurrencyCentavos(raw) : String(raw);
    case "date":
      return formatExportDate(typeof raw === "number" ? raw : String(raw));
    case "percent":
      return typeof raw === "number" ? formatExportPercent(raw) : String(raw);
    case "status": {
      const key = String(raw);
      return statusLabels?.[key] ?? key;
    }
    default:
      return String(raw);
  }
}

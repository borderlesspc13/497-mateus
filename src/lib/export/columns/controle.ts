import type { ExportColumnDef } from "@/lib/export/types";
import {
  STATUS_INCONSISTENCIA_LABELS,
  STATUS_OPERACIONAL_LABELS,
  STATUS_POS_VENDA_LABELS,
} from "@/lib/export/formatters";
import type { VendaRow } from "@/lib/types/domain";

export type ControleExportModo = "inadimplencia" | "inconsistencia" | "pos-venda";

const CONTROLE_BASE_COLUMNS: ExportColumnDef<VendaRow>[] = [
  { header: "Contrato", accessor: (row) => row.numeroContrato },
  { header: "Grupo", accessor: (row) => row.grupo },
  { header: "Cota", accessor: (row) => row.cota },
  { header: "Vencimento (dia)", accessor: (row) => row.dataVencimento },
  { header: "Consorciado", accessor: (row) => row.consorciado?.nome },
  { header: "Telefone", accessor: (row) => row.consorciado?.telefone },
  {
    header: "Status",
    accessor: (row) => row.statusOperacional,
    format: "status",
    statusLabels: STATUS_OPERACIONAL_LABELS,
  },
  { header: "Equipe", accessor: (row) => row.equipe?.nome },
  { header: "Vendedor", accessor: (row) => row.vendedor?.nome },
  { header: "Valor", accessor: (row) => row.valorCentavos, format: "currency" },
];

const INCONSISTENCIA_COLUMN: ExportColumnDef<VendaRow> = {
  header: "Inconsistência",
  accessor: (row) => row.statusInconsistencia,
  format: "status",
  statusLabels: STATUS_INCONSISTENCIA_LABELS,
};

const POS_VENDA_COLUMN: ExportColumnDef<VendaRow> = {
  header: "Pós-venda",
  accessor: (row) => row.statusPosVenda,
  format: "status",
  statusLabels: STATUS_POS_VENDA_LABELS,
};

export function getControleExportColumns(modo: ControleExportModo): ExportColumnDef<VendaRow>[] {
  const statusIndex = CONTROLE_BASE_COLUMNS.findIndex((column) => column.header === "Status");
  const beforeStatus = CONTROLE_BASE_COLUMNS.slice(0, statusIndex + 1);
  const afterStatus = CONTROLE_BASE_COLUMNS.slice(statusIndex + 1);

  if (modo === "inconsistencia") {
    return [...beforeStatus, INCONSISTENCIA_COLUMN, ...afterStatus];
  }

  if (modo === "pos-venda") {
    return [...beforeStatus, POS_VENDA_COLUMN, ...afterStatus];
  }

  return [...CONTROLE_BASE_COLUMNS];
}

export function getControleExportFileNameBase(modo: ControleExportModo): string {
  if (modo === "inadimplencia") return "controle_inadimplencia";
  if (modo === "inconsistencia") return "controle_inconsistencia";
  return "controle_pos_venda";
}

export function getControleExportSheetName(modo: ControleExportModo): string {
  if (modo === "inadimplencia") return "Inadimplência";
  if (modo === "inconsistencia") return "Inconsistência";
  return "Pós-venda";
}

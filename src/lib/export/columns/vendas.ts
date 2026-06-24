import type { ExportColumnDef } from "@/lib/export/types";
import {
  STATUS_INCONSISTENCIA_LABELS,
  STATUS_OPERACIONAL_LABELS,
  STATUS_POS_VENDA_LABELS,
} from "@/lib/export/formatters";
import type { VendaRow } from "@/lib/types/domain";import {
  countChecklistPendente,
  getPendenciaNivel,
  isChecklistCompleto,
} from "@/lib/vendas/pendencia";

function formatPendenciaPosVenda(venda: VendaRow): string {
  const parts: string[] = [];
  const nivel = getPendenciaNivel(venda);

  if (nivel === "atrasado") parts.push("Atrasado");
  if (nivel === "pendente") parts.push("Alerta ativo");

  if (!isChecklistCompleto(venda.checklistAtivacao)) {
    parts.push(`Ativação ${countChecklistPendente(venda.checklistAtivacao)}/3`);
  } else {
    parts.push("Ativado");
  }

  return parts.join(", ");
}

export const VENDAS_EXPORT_COLUMNS: ExportColumnDef<VendaRow>[] = [
  { header: "Contrato", accessor: (row) => row.numeroContrato },
  { header: "Grupo", accessor: (row) => row.grupo },
  { header: "Cota", accessor: (row) => row.cota },
  { header: "Vencimento (dia)", accessor: (row) => row.dataVencimento },
  { header: "Consorciado", accessor: (row) => row.consorciado?.nome },
  { header: "CPF/CNPJ", accessor: (row) => row.consorciado?.cpf_cnpj },
  { header: "Equipe", accessor: (row) => row.equipe?.nome },
  { header: "Vendedor", accessor: (row) => row.vendedor?.nome },
  { header: "Administradora", accessor: (row) => row.administradora?.nome },
  { header: "CNPJ Administradora", accessor: (row) => row.administradora?.cnpj },
  { header: "Plano", accessor: (row) => row.plano?.nome },
  { header: "Tipo de bem", accessor: (row) => row.plano?.tipoBem },
  {
    header: "Status",
    accessor: (row) => row.statusOperacional,
    format: "status",
    statusLabels: STATUS_OPERACIONAL_LABELS,
  },
  {
    header: "Inconsistência",
    accessor: (row) => row.statusInconsistencia,
    format: "status",
    statusLabels: STATUS_INCONSISTENCIA_LABELS,
  },
  {
    header: "Pós-venda",
    accessor: (row) => row.statusPosVenda,
    format: "status",
    statusLabels: STATUS_POS_VENDA_LABELS,
  },
  { header: "Pendências", accessor: formatPendenciaPosVenda },
  { header: "Valor", accessor: (row) => row.valorCentavos, format: "currency" },
  { header: "Data da venda", accessor: (row) => row.dataVenda, format: "date" },
  { header: "Mês/ano fechamento", accessor: (row) => row.mesAnoFechamento },
  { header: "Criado em", accessor: (row) => row.createdAt, format: "date" },
];

import type { ExportColumnDef } from "@/lib/export/types";
import { EXTRATO_TIPO_LABELS } from "@/lib/export/formatters";
import type { ExtratoRow } from "@/lib/types/domain";

export const COMISSOES_EXPORT_COLUMNS: ExportColumnDef<ExtratoRow>[] = [
  { header: "Contrato", accessor: (row) => row.numeroContrato },
  { header: "Consorciado", accessor: (row) => row.consorciadoNome },
  { header: "Plano", accessor: (row) => row.planoNome },
  { header: "Vendedor", accessor: (row) => row.vendedorNome },
  { header: "Equipe", accessor: (row) => row.equipeNome },
  { header: "Crédito", accessor: (row) => row.creditoCentavos, format: "currency" },
  { header: "% Comissão", accessor: (row) => row.percentualComissao, format: "percent" },
  { header: "Parcela", accessor: (row) => row.parcelaLabel },
  { header: "Total parcelas", accessor: (row) => row.parcelaTotal },
  { header: "Valor", accessor: (row) => row.valorCentavos, format: "currency" },
  {
    header: "Tipo",
    accessor: (row) => row.tipo,
    format: "status",
    statusLabels: EXTRATO_TIPO_LABELS,
  },
  {
    header: "Status",
    accessor: (row) => row.status,
    format: "status",
    statusLabels: {
      PENDENTE: "Pendente",
      LIBERADO: "Liberado",
      PAGO: "Pago",
    },
  },
  { header: "Criado em", accessor: (row) => row.createdAt, format: "date" },
];

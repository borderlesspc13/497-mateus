import type { ExportColumnDef } from "@/lib/export/types";
import { EXTRATO_TIPO_LABELS } from "@/lib/export/formatters";
import { PAPEL_REPASSE_LABELS } from "@/lib/comissoes/regras-repasse";
import type { ExtratoRow, PapelRepasse, RepasseRow } from "@/lib/types/domain";

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
      RECEBIDO: "Recebido",
      LIBERADO: "Liberado",
      PAGO: "Pago",
    },
  },
  { header: "Criado em", accessor: (row) => row.createdAt, format: "date" },
];

export const REPASSES_EXPORT_COLUMNS: ExportColumnDef<RepasseRow>[] = [
  { header: "Contrato", accessor: (row) => row.numeroContrato },
  { header: "Beneficiário", accessor: (row) => row.beneficiarioNome },
  {
    header: "Papel",
    accessor: (row) => PAPEL_REPASSE_LABELS[row.papel as PapelRepasse] ?? row.papel,
  },
  { header: "Consorciado", accessor: (row) => row.consorciadoNome },
  { header: "Plano", accessor: (row) => row.planoNome },
  { header: "Vendedor", accessor: (row) => row.vendedorNome },
  { header: "Equipe", accessor: (row) => row.equipeNome },
  { header: "Parcela", accessor: (row) => row.parcelaLabel },
  { header: "% Papel", accessor: (row) => row.percentualPapel, format: "percent" },
  { header: "Valor", accessor: (row) => row.valorCentavos, format: "currency" },
  {
    header: "Status",
    accessor: (row) => row.status,
    format: "status",
    statusLabels: {
      PENDENTE: "Pendente",
      PAGO: "Pago",
    },
  },
  { header: "Criado em", accessor: (row) => row.createdAt, format: "date" },
];

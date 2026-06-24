import type { ConsorciadoVendaStats } from "@/lib/consorciados/consorciado-venda-stats";
import type { ExportColumnDef } from "@/lib/export/types";
import type { ConsorciadoRow } from "@/lib/types/domain";

export type ConsorciadoExportRow = ConsorciadoRow & {
  stats: ConsorciadoVendaStats | undefined;
};

export function buildConsorciadoExportRows(
  items: ConsorciadoRow[],
  statsMap: Map<string, ConsorciadoVendaStats>,
): ConsorciadoExportRow[] {
  return items.map((item) => ({
    ...item,
    stats: statsMap.get(item.id),
  }));
}

export const CONSORCIADOS_EXPORT_COLUMNS: ExportColumnDef<ConsorciadoExportRow>[] = [
  { header: "Nome", accessor: (row) => row.nome },
  { header: "CPF/CNPJ", accessor: (row) => row.cpf_cnpj },
  { header: "Telefone", accessor: (row) => row.telefone },
  { header: "E-mail", accessor: (row) => row.email },
  { header: "Total de cotas", accessor: (row) => row.stats?.totalCotas ?? 0 },
  { header: "Inadimplentes", accessor: (row) => row.stats?.inadimplentes ?? 0 },
  { header: "Inconsistentes", accessor: (row) => row.stats?.inconsistentes ?? 0 },
  { header: "Cadastrado em", accessor: (row) => row.criadoEm, format: "date" },
];

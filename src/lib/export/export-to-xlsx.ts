import { formatExportCellValue } from "@/lib/export/formatters";
import type { ExportColumnDef, ExportToXlsxOptions } from "@/lib/export/types";

export type { ExportColumnDef, ExportToXlsxOptions };

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, " ").trim();
  return cleaned.slice(0, 31) || "Dados";
}

export async function exportToXlsx<T>({
  fileName,
  sheetName,
  rows,
  columns,
}: ExportToXlsxOptions<T>): Promise<void> {
  if (columns.length === 0) {
    throw new Error("Informe ao menos uma coluna para exportação.");
  }

  const XLSX = await import("xlsx");

  const headerRow = columns.map((column) => column.header);
  const dataRows = rows.map((row) =>
    columns.map((column) => {
      const raw = column.accessor(row);
      return formatExportCellValue(raw, column.format ?? "text", column.statusLabels);
    }),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheetName));

  const normalizedFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, normalizedFileName);
}

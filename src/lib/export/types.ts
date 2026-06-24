export type ExportValueFormat = "text" | "currency" | "date" | "percent" | "status";

export type ExportColumnDef<T> = {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
  format?: ExportValueFormat;
  /** Rótulos para `format: "status"` — chave = valor bruto do accessor. */
  statusLabels?: Record<string, string>;
};

export type ExportToXlsxOptions<T> = {
  fileName: string;
  sheetName: string;
  rows: T[];
  columns: ExportColumnDef<T>[];
};

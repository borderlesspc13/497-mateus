"use client";

import { FileSpreadsheet } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ExportColumnDef } from "@/lib/export/types";
import { buildExportFileName } from "@/lib/export/filename";
import { cn } from "@/lib/utils";

type ExportButtonProps<T> = {
  fileNameBase: string;
  sheetName: string;
  rows: T[];
  columns: ExportColumnDef<T>[];
  disabled?: boolean;
  /** Indica que apenas os registros visíveis/carregados na tela serão exportados. */
  partialExport?: boolean;
  className?: string;
};

export function ExportButton<T>({
  fileNameBase,
  sheetName,
  rows,
  columns,
  disabled = false,
  partialExport = false,
  className,
}: ExportButtonProps<T>) {
  const [exporting, setExporting] = useState(false);

  const isDisabled = disabled || exporting || rows.length === 0;

  const tooltip = partialExport
    ? `Exporta os ${rows.length} registro(s) carregados e filtrados nesta tela para Excel (.xlsx).`
    : `Exporta os ${rows.length} registro(s) exibidos para Excel (.xlsx).`;

  const onExport = useCallback(() => {
    if (isDisabled) return;
    setExporting(true);
    void import("@/lib/export/export-to-xlsx")
      .then(({ exportToXlsx }) =>
        exportToXlsx({
          fileName: buildExportFileName(fileNameBase),
          sheetName,
          rows,
          columns,
        }),
      )
      .finally(() => {
        setExporting(false);
      });
  }, [columns, fileNameBase, isDisabled, rows, sheetName]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-10 shrink-0", className)}
          disabled={isDisabled}
          onClick={onExport}
          aria-label="Exportar para Excel"
        >
          <FileSpreadsheet className="size-4" />
          {exporting ? "Exportando..." : "Exportar Excel"}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {isDisabled && rows.length === 0
          ? "Não há registros para exportar."
          : tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

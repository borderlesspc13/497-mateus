"use client";

import { DataGrid, type DataGridProps, type GridColDef } from "@mui/x-data-grid";
import { ptBR } from "@mui/x-data-grid/locales";
import { MuiDataGridProvider } from "@/components/providers/MuiThemeProvider";
import { cn } from "@/lib/utils";

export type PremiumDataTableProps<T extends { id: string }> = {
  rows: T[];
  columns: GridColDef<T>[];
  loading?: boolean;
  className?: string;
  pageSize?: number;
  autoHeight?: boolean;
} & Omit<DataGridProps<T>, "rows" | "columns" | "getRowId">;

export function PremiumDataTable<T extends { id: string }>({
  rows,
  columns,
  loading = false,
  className,
  pageSize = 25,
  autoHeight = true,
  ...props
}: PremiumDataTableProps<T>) {
  return (
    <MuiDataGridProvider>
      <div className={cn("w-full", className)}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight={autoHeight}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize } },
          }}
          localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            border: "none",
            borderRadius: 0,
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            color: "var(--foreground)",
            backgroundColor: "var(--card)",
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "var(--muted)",
              borderBottom: "1px solid var(--border)",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--muted-foreground)",
            },
            "& .MuiDataGrid-row:nth-of-type(even)": {
              backgroundColor: "color-mix(in srgb, var(--muted) 70%, transparent)",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "var(--accent)",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid var(--border)",
              fontSize: "14px",
              color: "var(--foreground)",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid var(--border)",
              color: "var(--muted-foreground)",
            },
          }}
          {...props}
        />
      </div>
    </MuiDataGridProvider>
  );
}

export type { GridColDef };

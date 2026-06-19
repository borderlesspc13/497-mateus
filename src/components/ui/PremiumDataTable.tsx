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
            "& .MuiDataGrid-columnSeparator": { display: "none" },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#fafafa",
              borderBottom: "1px solid #e4e4e7",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#71717a",
            },
            "& .MuiDataGrid-row:nth-of-type(even)": {
              backgroundColor: "rgba(250, 250, 250, 0.8)",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#f4f4f5",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f4f4f5",
              fontSize: "14px",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #e4e4e7",
            },
          }}
          {...props}
        />
      </div>
    </MuiDataGridProvider>
  );
}

export type { GridColDef };

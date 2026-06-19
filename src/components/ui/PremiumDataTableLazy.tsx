"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { PremiumDataTableProps } from "@/components/ui/PremiumDataTable";
import { TableSkeleton } from "@/components/ui/Skeleton";

const PremiumDataTableLazy = dynamic(
  () =>
    import("@/components/ui/PremiumDataTable").then((mod) => ({
      default: mod.PremiumDataTable,
    })),
  {
    ssr: false,
    loading: () => <TableSkeleton rows={8} columns={6} />,
  },
) as ComponentType<PremiumDataTableProps<{ id: string }>>;

export function PremiumDataTable<T extends { id: string }>(props: PremiumDataTableProps<T>) {
  return <PremiumDataTableLazy {...(props as PremiumDataTableProps<{ id: string }>)} />;
}

export type { GridColDef } from "@/components/ui/PremiumDataTable";

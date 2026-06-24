import { TableSkeleton } from "@/components/ui/Skeleton";
import { panelClass } from "@/components/ui/list-panel-classes";

type PageLoadingProps = {
  rows?: number;
  columns?: number;
  withHeader?: boolean;
};

export function PageLoading({ rows = 8, columns = 4, withHeader = true }: PageLoadingProps) {
  return (
    <div className="space-y-8">
      {withHeader ? (
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
        </div>
      ) : null}
      <div className={`${panelClass()} p-6`}>
        <TableSkeleton rows={rows} columns={columns} />
      </div>
    </div>
  );
}

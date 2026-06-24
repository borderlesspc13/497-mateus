type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={[
        "animate-pulse rounded-lg bg-muted",
        className,
      ].join(" ")}
      aria-hidden
    />
  );
}

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="space-y-3" aria-label="Carregando dados">
      <div className="flex gap-4 border-b border-border pb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={`row-${row}`} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={`cell-${row}-${col}`}
              className={`h-4 flex-1 ${col === 0 ? "max-w-[40%]" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

type DetailPageSkeletonProps = {
  sections?: number;
};

export function DetailPageSkeleton({ sections = 2 }: DetailPageSkeletonProps) {
  return (
    <div className="space-y-5" aria-label="Carregando ficha">
      {Array.from({ length: sections }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <Skeleton className="h-4 w-36" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full max-w-[10rem]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type KpiCardSkeletonProps = {
  count?: number;
};

export function KpiCardSkeleton({ count = 6 }: KpiCardSkeletonProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          aria-hidden
        >
          <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <Skeleton className="mx-auto mt-5 h-10 w-20" />
          <Skeleton className="mx-auto mt-3 h-3 w-28" />
          <Skeleton className="mx-auto mt-4 h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

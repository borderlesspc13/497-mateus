import { KpiCardSkeleton } from "@/components/ui/Skeleton";
import { panelClass } from "@/components/ui/list-panel-classes";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="h-9 w-48 animate-pulse rounded-lg bg-zinc-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-zinc-200" />
      </div>
      <KpiCardSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${panelClass()} p-6 lg:col-span-2`}>
          <div className="h-5 w-56 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        </div>
        <div className={`${panelClass()} p-6`}>
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded-lg bg-zinc-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

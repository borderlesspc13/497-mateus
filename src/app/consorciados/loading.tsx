import { TableSkeleton } from "@/components/ui/Skeleton";
import { panelClass } from "@/components/ui/list-panel-classes";

export default function ConsorciadosLoading() {
  return (
    <div className={`${panelClass()} p-6`}>
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}

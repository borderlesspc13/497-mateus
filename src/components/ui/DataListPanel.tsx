import type { ReactNode } from "react";
import { filterToolbarClass, panelClass } from "./list-panel-classes";

type DataListPanelProps = {
  title?: string;
  toolbar?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
};

export function DataListPanel({
  title = "Lista",
  toolbar,
  error,
  children,
}: DataListPanelProps) {
  return (
    <div className={panelClass()}>
      <div className="flex flex-col gap-4 border-b border-zinc-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <p className="mt-1 text-xs text-zinc-500">Filtre, busque e gerencie os registros abaixo.</p>
        </div>
        {toolbar ? <div className={filterToolbarClass()}>{toolbar}</div> : null}
      </div>

      {error ? <div className="border-b border-zinc-100 px-6 py-4">{error}</div> : null}

      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

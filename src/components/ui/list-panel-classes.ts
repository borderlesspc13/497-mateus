/** Classes compartilhadas para painéis de listagem (Server e Client). */

export function panelClass() {
  return "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm";
}

export function formControlClass(width?: "sm" | "md" | "lg") {
  const w =
    width === "sm"
      ? "sm:w-48"
      : width === "md"
        ? "sm:w-56"
        : width === "lg"
          ? "sm:min-w-[16rem] sm:flex-1"
          : "";
  return [
    "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors",
    "placeholder:text-zinc-400",
    "focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300/60",
    w,
  ]
    .filter(Boolean)
    .join(" ");
}

export function filterToolbarClass() {
  return "flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center";
}

export function tableWrapClass() {
  return "-mx-6 overflow-x-auto px-6";
}

export function dataTableClass() {
  return "w-full min-w-[640px] border-collapse text-left text-sm";
}

export function tableHeadCellClass() {
  return "whitespace-nowrap pb-4 pr-5 text-xs font-semibold uppercase tracking-wide text-zinc-500";
}

export function tableCellClass() {
  return "border-t border-zinc-100 py-4 pr-5 align-middle text-zinc-700";
}

export function tableRowClass(index: number) {
  return index % 2 === 1 ? "bg-zinc-50/80" : "bg-white";
}

export function primaryActionClass() {
  return "inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";
}

export function secondaryActionClass() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";
}

export function dangerActionClass() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-white px-3.5 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300";
}

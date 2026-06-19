/** Classes compartilhadas para painéis de listagem (Server e Client). */

export function panelClass() {
  return "overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm";
}

/** Painéis de formulário — sem overflow-hidden para não cortar dropdowns/autocomplete. */
export function formSectionClass() {
  return "rounded-2xl border border-border bg-card text-card-foreground shadow-sm";
}

/** Padding horizontal padrão de painéis (listas, cabeçalhos, rodapés). */
export function panelInsetClass() {
  return "px-4 sm:px-6 lg:px-8";
}

export function formControlClass(width?: "sm" | "md" | "lg" | "search") {
  const w =
    width === "sm"
      ? "w-full sm:w-44"
      : width === "md"
        ? "w-full sm:w-52"
        : width === "lg" || width === "search"
          ? "w-full min-w-0 sm:min-w-[12rem] lg:flex-1 lg:basis-64"
          : "";
  return [
    "h-10 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground shadow-sm outline-none transition-colors",
    "placeholder:text-muted-foreground",
    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
    w,
  ]
    .filter(Boolean)
    .join(" ");
}

export function filterToolbarClass() {
  return "flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center";
}

export function tableWrapClass() {
  return "w-full overflow-x-auto overscroll-x-contain";
}

export function dataTableClass() {
  return "w-full min-w-full border-collapse text-left text-sm";
}

export function tableHeadCellClass() {
  return [
    "whitespace-nowrap pb-2.5 pr-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
    "first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6 lg:first:pl-8 lg:last:pr-8",
  ].join(" ");
}

export function tableCellClass() {
  return [
    "border-t border-border/60 py-3 pr-4 align-middle text-foreground/80",
    "first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6 lg:first:pl-8 lg:last:pr-8",
  ].join(" ");
}

export function tableRowClass(index: number) {
  return index % 2 === 1 ? "bg-muted/50" : "bg-card";
}

export function primaryActionClass() {
  return "inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
}

export function secondaryActionClass() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-input bg-background px-3.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
}

export function dangerActionClass() {
  return "inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-background px-3.5 text-xs font-semibold text-red-700 shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300";
}

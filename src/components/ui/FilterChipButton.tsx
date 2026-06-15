import type { ReactNode } from "react";

type FilterChipButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
};

export function FilterChipButton({ active, onClick, children, count }: FilterChipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition-colors",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
      ].join(" ")}
    >
      {children}
      {count !== undefined ? (
        <span
          className={[
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] tabular-nums",
            active ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-600",
          ].join(" ")}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function FilterChipBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group">
      {children}
    </div>
  );
}

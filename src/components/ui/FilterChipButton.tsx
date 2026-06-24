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
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent",
      ].join(" ")}
    >
      {children}
      {count !== undefined ? (
        <span
          className={[
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] tabular-nums",
            active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground",
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

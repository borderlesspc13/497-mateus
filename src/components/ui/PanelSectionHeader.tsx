import type { ReactNode } from "react";
import { panelInsetClass } from "./list-panel-classes";

type PanelSectionHeaderProps = {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  variant?: "default" | "warning" | "success";
};

const VARIANT_CLASSES = {
  default: "border-border bg-card",
  warning: "border-amber-500/30 bg-amber-500/10",
  success: "border-emerald-500/30 bg-emerald-500/10",
} as const;

const TITLE_CLASSES = {
  default: "text-foreground",
  warning: "text-amber-900 dark:text-amber-100",
  success: "text-emerald-900 dark:text-emerald-100",
} as const;

const DESCRIPTION_CLASSES = {
  default: "text-muted-foreground",
  warning: "text-amber-800 dark:text-amber-200",
  success: "text-emerald-800 dark:text-emerald-200",
} as const;

export function PanelSectionHeader({
  title,
  description,
  meta,
  actions,
  variant = "default",
}: PanelSectionHeaderProps) {
  return (
    <div
      className={[
        "border-b py-4 sm:py-5",
        panelInsetClass(),
        VARIANT_CLASSES[variant],
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className={`text-base font-semibold ${TITLE_CLASSES[variant]}`}>{title}</h2>
          {description ? (
            <p className={`mt-1 text-sm ${DESCRIPTION_CLASSES[variant]}`}>{description}</p>
          ) : null}
          {meta ? <div className="mt-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

type AlertTone = "error" | "warning" | "success" | "info";

type AlertBannerProps = {
  tone: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
};

const TONE_CLASSES: Record<AlertTone, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-300",
};

export function AlertBanner({ tone, title, children, className = "" }: AlertBannerProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={[
        "rounded-lg border p-3 text-sm",
        TONE_CLASSES[tone],
        className,
      ].join(" ")}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-2" : undefined}>{children}</div>
    </div>
  );
}

import type { ReactNode } from "react";

type AlertTone = "error" | "warning" | "success" | "info";

type AlertBannerProps = {
  tone: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
};

const TONE_CLASSES: Record<AlertTone, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
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

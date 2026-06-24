type SummaryChipTone = "neutral" | "green" | "yellow" | "red";

type SummaryChipProps = {
  label: string;
  value: number;
  tone?: SummaryChipTone;
};

const TONE_CLASSES: Record<SummaryChipTone, string> = {
  neutral: "border-border bg-muted text-foreground",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  yellow: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  red: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300",
};

export function SummaryChip({ label, value, tone = "neutral" }: SummaryChipProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        TONE_CLASSES[tone],
      ].join(" ")}
    >
      {label}
      <span className="tabular-nums">{value}</span>
    </span>
  );
}

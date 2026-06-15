type SummaryChipTone = "neutral" | "green" | "yellow" | "red";

type SummaryChipProps = {
  label: string;
  value: number;
  tone?: SummaryChipTone;
};

const TONE_CLASSES: Record<SummaryChipTone, string> = {
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-800",
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

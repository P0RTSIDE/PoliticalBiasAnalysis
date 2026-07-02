import { cn } from "@/lib/utils";

type Accent = "left" | "right" | "neutral" | "highlight";

const ACCENT_STYLES: Record<Accent, { border: string; text: string; dot: string }> =
  {
    left: { border: "border-l-left-blindspot", text: "text-left-blindspot", dot: "bg-left-blindspot" },
    right: { border: "border-l-right-blindspot", text: "text-right-blindspot", dot: "bg-right-blindspot" },
    neutral: { border: "border-l-balanced", text: "text-balanced", dot: "bg-balanced" },
    highlight: { border: "border-l-highlight", text: "text-highlight", dot: "bg-highlight" },
  };

interface InsightCalloutProps {
  /** Big statement, e.g. "Science stories are covered 3x more by left-leaning outlets". */
  statement: string;
  /** Optional supporting detail line. */
  detail?: string;
  /** Optional eyebrow label, e.g. category name. */
  eyebrow?: string;
  /** Optional headline metric to display prominently. */
  metric?: string;
  accent?: Accent;
  className?: string;
}

export function InsightCallout({
  statement,
  detail,
  eyebrow,
  metric,
  accent = "highlight",
  className,
}: InsightCalloutProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div
      className={cn(
        "border border-hairline border-l-2 bg-surface p-5",
        styles.border,
        className
      )}
    >
      {eyebrow && (
        <div className="mb-2 flex items-center gap-2">
          <span className={cn("h-2 w-2", styles.dot)} />
          <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            {eyebrow}
          </span>
        </div>
      )}
      {metric && (
        <div className={cn("font-mono text-3xl font-bold", styles.text)}>
          {metric}
        </div>
      )}
      <p className="mt-1 text-base leading-snug text-text-primary">{statement}</p>
      {detail && (
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {detail}
        </p>
      )}
    </div>
  );
}

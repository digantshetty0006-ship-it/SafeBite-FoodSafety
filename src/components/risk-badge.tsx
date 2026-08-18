import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { riskBand, type RiskBand } from "@/lib/rating";

const TIER_STYLES: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  B: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  C: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  D: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
};

export const BAND_TIER: Record<RiskBand, string> = {
  low: "A",
  moderate: "B",
  high: "C",
  critical: "D",
};

export const BAND_LABELS: Record<RiskBand, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  high: "High risk",
  critical: "Critical risk",
};

export const SCORE_COLORS: Record<string, string> = {
  A: "text-emerald-600",
  B: "text-amber-600",
  C: "text-orange-600",
  D: "text-red-600",
};

export const SCORE_BAR_COLORS: Record<string, string> = {
  A: "bg-emerald-500",
  B: "bg-amber-500",
  C: "bg-orange-500",
  D: "bg-red-500",
};

export function tierForScore(score: number): string {
  if (score <= 25) return "A";
  if (score <= 50) return "B";
  if (score <= 75) return "C";
  return "D";
}

export function RiskBadge({ score, className }: { score: number; className?: string }) {
  const tier = tierForScore(score);
  return (
    <Badge variant="outline" className={cn("text-xs", TIER_STYLES[tier], className)}>
      {BAND_LABELS[riskBand(score) ?? "low"]}
    </Badge>
  );
}

export function RiskScore({ score, className }: { score: number; className?: string }) {
  const tier = tierForScore(score);
  return (
    <span className={cn("font-mono font-semibold tabular-nums", SCORE_COLORS[tier], className)}>{Math.round(score)}</span>
  );
}

export function RiskScoreBar({ score, className }: { score: number; className?: string }) {
  const tier = tierForScore(score);
  const clamped = Math.min(100, Math.max(0, score));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", SCORE_BAR_COLORS[tier])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={cn("w-8 text-right font-mono text-xs font-semibold tabular-nums", SCORE_COLORS[tier])}>
        {Math.round(clamped)}
      </span>
    </div>
  );
}

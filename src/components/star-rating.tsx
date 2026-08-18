import { cn } from "@/lib/utils";
import { formatRating, ratingToPercent } from "@/lib/rating";

function StarIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cn("shrink-0", className)}>
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

export function StarRating({
  rating,
  size = 16,
  gap = 3,
  className,
  showValue = false,
  valueClassName,
}: {
  rating: number | null;
  size?: number;
  gap?: number;
  className?: string;
  showValue?: boolean;
  valueClassName?: string;
}) {
  const pct = ratingToPercent(rating);
  const rowWidth = size * 5 + gap * 4;
  const row = (cls: string) => (
    <div className={cls} style={{ display: "flex", gap, width: rowWidth, flexShrink: 0 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} size={size} />
      ))}
    </div>
  );

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {showValue && (
        <span className={cn("font-bold tabular-nums leading-none", valueClassName)}>
          {formatRating(rating)}
        </span>
      )}
      <span className="relative inline-flex" style={{ width: rowWidth, height: size }} aria-hidden="true">
        {row(rating === null ? "text-muted-foreground/20" : "text-muted-foreground/25")}
        {rating !== null && (
          <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
            {row("text-amber-400")}
          </span>
        )}
      </span>
    </span>
  );
}

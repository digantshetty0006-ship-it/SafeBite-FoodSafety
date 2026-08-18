import Link from "next/link";
import { MapPin, Star, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RestaurantCardProps {
  name: string;
  category: string;
  district: string;
  address?: string;
  distanceKm?: number;
  safetyScore: number;
  riskTier: string;
  imageUrl?: string;
  href?: string;
  actionLabel: string;
  distLabel?: string;
  scoreLabel: string;
  tierA: string;
  tierB: string;
  tierC: string;
}

function tierOf(tier: string, tierA: string, tierB: string, tierC: string) {
  if (tier === "A") return { text: tierA, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" };
  if (tier === "C") return { text: tierC, cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" };
  return { text: tierB, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" };
}

export function RestaurantCard({
  name,
  category,
  district,
  address,
  distanceKm,
  safetyScore,
  riskTier,
  imageUrl,
  href,
  actionLabel,
  distLabel,
  scoreLabel,
  tierA,
  tierB,
  tierC,
}: RestaurantCardProps) {
  const tier = tierOf(riskTier, tierA, tierB, tierC);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="relative h-36">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800">
            <span className="text-5xl font-bold text-white/85">{(name.trim()[0] ?? "F").toUpperCase()}</span>
          </div>
        )}
        <span className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tier.cls}`}>
          {tier.text}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{name}</h3>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Utensils className="h-3 w-3" /> {category}
          <span className="mx-0.5">·</span>
          {district}
        </p>
        {distanceKm !== undefined && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {distLabel}
          </p>
        )}
        {address && <p className="mt-0.5 truncate text-xs text-muted-foreground">{address}</p>}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <Star className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{scoreLabel}</span>
              <span className="font-bold">{safetyScore}/100</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ width: `${safetyScore}%` }}
              />
            </div>
          </div>
        </div>
        {href && (
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link href={href}>{actionLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect } from "react";
import { MapPin, Navigation, Star, Utensils, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { directionsUrl, mapsUrl } from "@/lib/business-info";

export interface RestaurantModalData {
  name: string;
  category: string;
  district: string;
  address?: string;
  googleAddress?: string;
  googleRating?: number | null;
  googleRatingCount?: number | null;
  safetyScore: number;
  riskTier: string;
  imageUrl: string;
  placeId?: string;
}

interface Props {
  data: RestaurantModalData;
  onClose: () => void;
  scoreLabel: string;
  tierA: string;
  tierB: string;
  tierC: string;
  directionsLabel: string;
  mapsLabel: string;
  ratingLabel: string;
}

function tierOf(tier: string, tierA: string, tierB: string, tierC: string) {
  if (tier === "A") return { text: tierA, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" };
  if (tier === "C") return { text: tierC, cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" };
  return { text: tierB, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" };
}

export function RestaurantModal({ data, onClose, scoreLabel, tierA, tierB, tierC, directionsLabel, mapsLabel, ratingLabel }: Props) {
  const tier = tierOf(data.riskTier, tierA, tierB, tierC);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img src={data.imageUrl} alt={data.name} className="h-64 w-full object-cover sm:h-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <span className={`absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tier.cls}`}>
            {tier.text}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-xl font-bold text-white">{data.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-white/85">
              <Utensils className="h-3.5 w-3.5" /> {data.category} <span>·</span> {data.district}
            </p>
          </div>
        </div>

        <div className="max-h-[45vh] overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <Star className="h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{scoreLabel}</span>
                <span className="font-bold">{data.safetyScore}/100</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${data.safetyScore}%` }}
                />
              </div>
            </div>
          </div>

          {(data.address || data.googleAddress) && (
            <p className="mt-4 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{data.googleAddress ?? data.address}</span>
            </p>
          )}

          {typeof data.googleRating === "number" && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{ratingLabel}:</span>{" "}
              {"★".repeat(Math.round(data.googleRating))}
              <span className="mx-1">{data.googleRating.toFixed(1)}</span>
              {typeof data.googleRatingCount === "number" && data.googleRatingCount > 0 && (
                <span className="text-xs">({data.googleRatingCount.toLocaleString()})</span>
              )}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button asChild className="w-full gap-2">
              <a href={directionsUrl(data.placeId, data.name, data.district)} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4" /> {directionsLabel}
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2">
              <a href={mapsUrl(data.placeId, data.name, data.district)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> {mapsLabel}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

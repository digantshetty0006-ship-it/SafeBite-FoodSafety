"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { RestaurantModal, type RestaurantModalData } from "@/components/restaurant-modal";

export interface RestaurantCardProps {
  name: string;
  category: string;
  district: string;
  address?: string;
  googleAddress?: string;
  googleRating?: number | null;
  distanceKm?: number;
  rating: number | null;
  riskScore: number | null;
  imageUrl: string;
  placeId?: string;
  href?: string;
  actionLabel: string;
  distLabel?: string;
  ratingLabel: string;
  notRatedLabel: string;
  basedOnLabel: string;
  riskLabels: Record<string, string>;
  directionsLabel: string;
  mapsLabel: string;
  googleRatingLabel: string;
}

export function RestaurantCard({
  name,
  category,
  district,
  address,
  googleAddress,
  googleRating,
  distanceKm,
  rating,
  riskScore,
  imageUrl,
  placeId,
  href,
  actionLabel,
  distLabel,
  ratingLabel,
  notRatedLabel,
  basedOnLabel,
  riskLabels,
  directionsLabel,
  mapsLabel,
  googleRatingLabel,
}: RestaurantCardProps) {
  const [open, setOpen] = useState(false);

  const modalData: RestaurantModalData = {
    name,
    category,
    district,
    address,
    googleAddress,
    googleRating,
    rating,
    riskScore,
    imageUrl,
    placeId,
  };

  return (
    <>
      <div
        className="flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        onClick={() => setOpen(true)}
      >
        <div className="relative h-36">
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
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
          {(address || googleAddress) && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{googleAddress ?? address}</p>
          )}
          <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
            <StarRating rating={rating} showValue size={16} gap={2} valueClassName="text-base" />
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              {rating === null ? notRatedLabel : ratingLabel}
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            {href && (
              <Button asChild variant="outline" size="sm" className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Link href={href}>{actionLabel}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      {open && (
        <RestaurantModal
          data={modalData}
          onClose={() => setOpen(false)}
          ratingLabel={ratingLabel}
          notRatedLabel={notRatedLabel}
          basedOnLabel={basedOnLabel}
          riskLabels={riskLabels}
          directionsLabel={directionsLabel}
          mapsLabel={mapsLabel}
          googleRatingLabel={googleRatingLabel}
        />
      )}
    </>
  );
}

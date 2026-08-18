"use server";

import { db } from "@/lib/db";
import { getBusinessInfo } from "@/lib/business-info";
import { riskToRating } from "@/lib/rating";

export interface NearbyBusiness {
  id: string;
  name: string;
  category: string;
  district: string;
  address: string;
  distanceKm: number;
  rating: number | null;
  riskScore: number;
  imageUrl: string;
  placeId?: string;
  googleAddress?: string;
  googleRating?: number | null;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function findNearbyBusinesses(lat: number, lng: number, limit = 8): Promise<NearbyBusiness[]> {
  const businesses = await db.business.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      district: true,
      address: true,
      lat: true,
      lng: true,
      riskScore: true,
      riskTier: true,
    },
  });
  return Promise.all(
    businesses
      .map((b) => ({ ...b, distanceKm: distanceKm(lat, lng, b.lat, b.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit)
      .map(async (b) => {
        const info = await getBusinessInfo(b.name, b.district);
        return {
          id: b.id,
          name: b.name,
          category: b.category,
          district: b.district,
          address: b.address,
          distanceKm: Math.round(b.distanceKm * 10) / 10,
          rating: riskToRating(b.riskScore),
          riskScore: b.riskScore,
          imageUrl: info.imageUrl,
          placeId: info.placeId,
          googleAddress: info.googleAddress,
          googleRating: info.googleRating,
        };
      })
  );
}
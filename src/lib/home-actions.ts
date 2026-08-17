"use server";

import { db } from "@/lib/db";

export interface NearbyBusiness {
  id: string;
  name: string;
  category: string;
  district: string;
  address: string;
  distanceKm: number;
  safetyScore: number;
  riskTier: string;
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
  return businesses
    .map((b) => ({ ...b, distanceKm: distanceKm(lat, lng, b.lat, b.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
    .map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      district: b.district,
      address: b.address,
      distanceKm: Math.round(b.distanceKm * 10) / 10,
      safetyScore: Math.max(0, Math.min(100, Math.round(100 - b.riskScore))),
      riskTier: b.riskTier,
    }));
}
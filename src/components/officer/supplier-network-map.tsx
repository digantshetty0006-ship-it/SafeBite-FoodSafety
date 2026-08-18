"use client";

import dynamic from "next/dynamic";
import type { Lang } from "@/lib/i18n";

export interface MapPoint {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  count: number;
}

const LeafletMap = dynamic(() => import("./supplier-network-leaflet").then((m) => m.SupplierNetworkLeaflet), {
  ssr: false,
});

export function SupplierNetworkMap({ points, lang }: { points: MapPoint[]; lang: Lang }) {
  return <LeafletMap points={points} lang={lang} />;
}

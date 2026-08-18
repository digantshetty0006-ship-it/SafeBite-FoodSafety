"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "./supplier-network-map";
import { tr, type Lang } from "@/lib/i18n";

function colorFor(count: number): string {
  if (count >= 4) return "#dc2626";
  if (count >= 2) return "#f59e0b";
  return "#059669";
}

export function SupplierNetworkLeaflet({ points, lang }: { points: MapPoint[]; lang: Lang }) {
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);
  const center: [number, number] = points.length
    ? [
        points.reduce((a, p) => a + p.lat, 0) / points.length,
        points.reduce((a, p) => a + p.lng, 0) / points.length,
      ]
    : [20.6, 77];

  return (
    <MapContainer center={center} zoom={6} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={6}
          pathOptions={{ color: "#ffffff", weight: 1, fillColor: colorFor(p.count), fillOpacity: 0.9 }}
        >
          <Tooltip>
            {p.name} — {t("sn.restaurantsCol")}: {p.count}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

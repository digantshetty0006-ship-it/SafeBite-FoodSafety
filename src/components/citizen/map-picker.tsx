"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const pinIcon = L.divIcon({
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#dc2626;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export function MapPicker({
  lat,
  lng,
  onPick,
  className,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocation = async () => {
    const q = search.trim();
    if (!q) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q + ", India")}`
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      if (data?.[0]) {
        onPick(parseFloat(data[0].lat), parseFloat(data[0].lon));
        setSearch(data[0].display_name ?? q);
      } else {
        setError("No matching place found. Try a different area or landmark.");
      }
    } catch {
      setError("Search unavailable. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-2 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchLocation()}
            placeholder="Search area or landmark…"
            className="pl-8"
          />
        </div>
        <Button type="button" variant="outline" onClick={searchLocation} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Search className="mr-1 h-3.5 w-3.5" />}
          Find
        </Button>
      </div>
      {error && (
        <p className="mb-2 flex items-center gap-1 text-xs font-medium text-red-600">{error}</p>
      )}
      <div className="h-56 overflow-hidden rounded-lg border">
        {ready && (
          <MapContainer center={[lat, lng]} zoom={11} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onPick={onPick} />
            <FlyToController lat={lat} lng={lng} />
            <Marker position={[lat, lng]} icon={pinIcon} />
          </MapContainer>
        )}
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> Click the map to pin the location.
      </p>
    </div>
  );
}

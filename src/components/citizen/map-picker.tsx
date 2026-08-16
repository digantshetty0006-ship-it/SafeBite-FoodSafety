"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tr, type Lang } from "@/lib/i18n";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const pinIcon = L.divIcon({
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#dc2626;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export interface PickedPlace {
  address: string;
  district: string;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
}

// Map a Nominatim address onto the districts used by the demo's officers.
const DISTRICT_HINTS: [string, string][] = [
  ["navi mumbai", "Navi Mumbai"],
  ["mumbai", "Mumbai"],
  ["thane", "Thane"],
  ["pune", "Pune"],
  ["nashik", "Nashik"],
  ["nagpur", "Nagpur"],
];

function detectDistrict(a: NominatimAddress): string {
  const haystack = [
    a.state_district,
    a.city,
    a.town,
    a.village,
    a.state,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  for (const [key, label] of DISTRICT_HINTS) {
    if (haystack.includes(key)) return label;
  }
  return "Maharashtra";
}

function shortAddress(a: NominatimAddress): string {
  return [
    a.road ?? a.pedestrian,
    a.suburb ?? a.neighbourhood,
    a.city ?? a.town ?? a.village,
    a.state_district,
    a.state,
    a.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

interface GooglePrediction {
  placeId: string;
  primary: string;
  secondary: string;
}

interface GooglePlaceResult {
  lat: number;
  lng: number;
  address: string;
  district: string;
}

async function googleAutocomplete(input: string, center: [number, number]): Promise<GooglePrediction[]> {
  if (!GOOGLE_KEY) return [];
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_KEY },
    body: JSON.stringify({
      input,
      regionCode: "IN",
      languageCode: "en",
      locationBias: {
        circle: { center: { latitude: center[0], longitude: center[1] }, radius: 40000 },
      },
    }),
  });
  if (!res.ok) throw new Error(`google autocomplete ${res.status}`);
  const j = await res.json();
  return (j.suggestions ?? []).map((s: any) => ({
    placeId: s.placePrediction?.placeId ?? "",
    primary: s.placePrediction?.text?.text ?? "",
    secondary: s.placePrediction?.secondaryText?.text ?? "",
  }));
}

async function googlePlaceDetails(placeId: string): Promise<GooglePlaceResult> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?fields=location,formattedAddress,addressComponents&languageCode=en`,
    { headers: { "X-Goog-Api-Key": GOOGLE_KEY ?? "" } }
  );
  if (!res.ok) throw new Error(`google details ${res.status}`);
  const j = await res.json();
  const lat = j.location?.latitude;
  const lng = j.location?.longitude;
  if (lat == null || lng == null) throw new Error("no location");
  let district = "Maharashtra";
  for (const c of j.addressComponents ?? []) {
    const kinds = c.types ?? [];
    if (kinds.includes("administrative_area_level_2") || kinds.includes("locality")) {
      district = c.longText ?? c.shortText ?? district;
      break;
    }
  }
  return { lat, lng, address: j.formattedAddress ?? "", district };
}

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
  lang,
  className,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number, place?: Partial<PickedPlace>) => void;
  lang: Lang;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<GooglePrediction[]>([]);
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = (k: string, vars?: Record<string, string>) => tr(lang, k, vars);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();
    if (!q || !GOOGLE_KEY) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setSuggestions(await googleAutocomplete(q, [lat, lng]));
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, lat, lng]);

  const resolvePlace = async (a: number, b: number, prefer?: GooglePlaceResult) => {
    setResolving(true);
    try {
      if (prefer) {
        setPlace({ address: prefer.address, district: prefer.district });
        onPick(a, b, { address: prefer.address, district: prefer.district });
        return;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${a}&lon=${b}`
      );
      if (res.ok) {
        const j = await res.json();
        const addr: NominatimAddress = j.address ?? {};
        const resolved: PickedPlace = {
          address: shortAddress(addr),
          district: detectDistrict(addr),
        };
        setPlace(resolved);
        onPick(a, b, resolved);
      } else {
        setPlace(null);
        onPick(a, b, {});
      }
    } catch {
      setPlace(null);
      onPick(a, b, {});
    } finally {
      setResolving(false);
    }
  };

  const applyGooglePrediction = async (p: GooglePrediction) => {
    setSearch(p.primary + (p.secondary ? `, ${p.secondary}` : ""));
    setSuggestions([]);
    setBusy(true);
    setError(null);
    try {
      const d = await googlePlaceDetails(p.placeId);
      await resolvePlace(d.lat, d.lng, d);
    } catch {
      // Google failed — fall back to the previous Nominatim flow
      await searchNominatim(p.primary);
    } finally {
      setBusy(false);
    }
  };

  const searchNominatim = async (q: string) => {
    const query = q.trim();
    if (!query) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query + ", India")}`
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      if (data?.[0]) {
        setSearch(data[0].display_name ?? query);
        await resolvePlace(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        setError(t("pick.noMatch"));
      }
    } catch {
      setError(t("pick.searchUnavailable"));
    } finally {
      setBusy(false);
    }
  };

  const searchLocation = async () => {
    const q = search.trim();
    if (!q) return;
    if (GOOGLE_KEY) {
      try {
        const preds = await googleAutocomplete(q, [lat, lng]);
        if (preds[0]) {
          await applyGooglePrediction(preds[0]);
          return;
        }
        setError(t("pick.noMatch"));
        return;
      } catch {
        await searchNominatim(q);
        return;
      }
    }
    await searchNominatim(q);
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
            placeholder={t("pick.searchPlaceholder")}
            className="pl-8"
          />
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-background shadow-sm">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  onClick={() => void applyGooglePrediction(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.primary}</span>
                    {s.secondary && <span className="block truncate text-xs text-muted-foreground">{s.secondary}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="button" variant="outline" onClick={() => void searchLocation()} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Search className="mr-1 h-3.5 w-3.5" />}
          {t("pick.find")}
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
            <ClickHandler
              onPick={(a, b) => {
                setSearch("");
                setSuggestions([]);
                void resolvePlace(a, b);
              }}
            />
            <FlyToController lat={lat} lng={lng} />
            <Marker position={[lat, lng]} icon={pinIcon} />
          </MapContainer>
        )}
      </div>
      {resolving ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> {t("pick.resolving")}
        </p>
      ) : place ? (
        <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <p className="flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t("pick.resolved")}
          </p>
          <p className="mt-0.5">{place.address}</p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-emerald-900">
            <MapPin className="h-2.5 w-2.5" /> {t("pick.districtRoutes", { d: place.district })}
          </p>
        </div>
      ) : (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {t("pick.clickHint")}
        </p>
      )}
    </div>
  );
}
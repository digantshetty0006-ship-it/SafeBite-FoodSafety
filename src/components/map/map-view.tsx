"use client";

import dynamic from "next/dynamic";
import type { Lang } from "@/lib/i18n";

const DistrictMap = dynamic(() => import("./district-map").then((m) => m.DistrictMap), {
  ssr: false,
});

export default function MapView(props: { businesses: any[]; districts: any[]; complaints?: any[]; lang: Lang }) {
  return (
    <DistrictMap businesses={props.businesses} districts={props.districts} complaints={props.complaints} lang={props.lang} />
  );
}
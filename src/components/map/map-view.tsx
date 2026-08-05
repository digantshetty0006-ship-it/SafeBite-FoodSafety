"use client";

import dynamic from "next/dynamic";

const DistrictMap = dynamic(() => import("./district-map").then((m) => m.DistrictMap), {
  ssr: false,
});

export default function MapView(props: { businesses: any[]; districts: any[] }) {
  return <DistrictMap businesses={props.businesses} districts={props.districts} />;
}

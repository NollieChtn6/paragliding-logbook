"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./build-map-markers";

// ssr: false n'est utilisable que depuis un Client Component (interdit
// directement dans app/admin/map/page.tsx, qui est un Server Component) :
// Leaflet accède à window/document dès son import, ce qui casse le rendu
// serveur. Ce wrapper isole ce contournement, le composant carte lui-même
// (admin-map.tsx) reste normal.
const AdminMap = dynamic(() => import("./admin-map").then((mod) => mod.AdminMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[32rem] w-full items-center justify-center rounded-2xl border border-border bg-muted/30 text-sm text-muted-foreground">
      Chargement de la carte...
    </div>
  ),
});

export function AdminMapLoader({ markers }: { markers: MapMarker[] }) {
  return <AdminMap markers={markers} />;
}

"use client";

import dynamic from "next/dynamic";
import { useT } from "@/components/locale-provider";
import type { MapMarker } from "./build-map-markers";

// loading est rendu par next/dynamic comme un composant à part entière (pas
// juste une fonction utilitaire) : les hooks (useT) y sont donc utilisables
// normalement.
function MapLoadingFallback() {
  const t = useT();
  return (
    <div className="flex h-[32rem] w-full items-center justify-center rounded-2xl border border-border bg-muted/30 text-sm text-muted-foreground">
      {t.admin.mapLoading}
    </div>
  );
}

// ssr: false n'est utilisable que depuis un Client Component (interdit
// directement dans app/admin/map/page.tsx, qui est un Server Component) :
// Leaflet accède à window/document dès son import, ce qui casse le rendu
// serveur. Ce wrapper isole ce contournement, le composant carte lui-même
// (admin-map.tsx) reste normal.
const AdminMap = dynamic(() => import("./admin-map").then((mod) => mod.AdminMap), {
  ssr: false,
  loading: MapLoadingFallback,
});

export function AdminMapLoader({ markers }: { markers: MapMarker[] }) {
  return <AdminMap markers={markers} />;
}

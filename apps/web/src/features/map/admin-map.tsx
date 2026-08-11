"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowDownLeft, ArrowUpRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MapMarker, MapMarkerKind } from "./build-map-markers";

// Couleurs propres à cette carte (pas des tokens sémantiques réutilisés
// ailleurs) : décollage/atterrissage reprennent primary/accent (mêmes
// couleurs que les flèches de trajet, voir activities/[id]/page.tsx), mais
// École a besoin d'une troisième couleur bien distincte des deux autres
// puisque les trois catégories apparaissent ensemble sur la même carte —
// accent (ambre) est déjà pris par "atterrissage".
const MARKER_COLORS: Record<MapMarkerKind, string> = {
  TAKEOFF: "var(--primary)",
  LANDING: "var(--accent)",
  SCHOOL: "#7c3aed",
};

const MARKER_LABELS: Record<MapMarkerKind, string> = {
  TAKEOFF: "Décollage",
  LANDING: "Atterrissage",
  SCHOOL: "École",
};

const ALL_KINDS: MapMarkerKind[] = ["TAKEOFF", "LANDING", "SCHOOL"];

// Mêmes icônes que le reste de l'app pour ce type de lieu : ArrowUpRight/
// ArrowDownLeft pour décollage/atterrissage (trajet du vol, voir
// activities/[id]/page.tsx), GraduationCap pour école (ACTIVITY_TYPE_STYLE,
// components/activity-card.tsx).
const MARKER_ICON_COMPONENTS: Record<MapMarkerKind, typeof ArrowUpRight> = {
  TAKEOFF: ArrowUpRight,
  LANDING: ArrowDownLeft,
  SCHOOL: GraduationCap,
};

const MARKER_SIZE = 28;

// divIcon avec l'icône du type de lieu rendue en SVG statique (html/css
// inline) plutôt que l'icône par défaut de Leaflet (image) : évite le bug
// classique Leaflet + bundler (chemins d'images cassés par le bundling
// Next.js) sans dépendance à des assets externes. renderToStaticMarkup
// convertit l'icône Lucide (composant React) en balisage SVG brut
// utilisable par L.divIcon, qui n'accepte que du HTML.
function createMarkerIcon(kind: MapMarkerKind) {
  const Icon = MARKER_ICON_COMPONENTS[kind];
  const iconMarkup = renderToStaticMarkup(
    <Icon color="white" size={16} strokeWidth={2.5} aria-hidden />,
  );
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${MARKER_SIZE}px;height:${MARKER_SIZE}px;border-radius:9999px;background:${MARKER_COLORS[kind]};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.45);">${iconMarkup}</span>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
  });
}

// Centre par défaut : France métropolitaine, utilisé seulement s'il n'y a
// aucun marqueur à cadrer.
const DEFAULT_CENTER: [number, number] = [46.6, 2.4];
const DEFAULT_ZOOM = 5;
const SINGLE_MARKER_ZOOM = 13;
// Plus large que SINGLE_MARKER_ZOOM (13) : cette valeur zoome sur un point
// qu'on clique explicitement pour l'inspecter, pas sur l'unique marqueur
// restant après un filtre — un zoom aussi serré que 13 s'est révélé trop
// fort à l'usage pour ce cas (retour utilisateur).
const SELECTION_ZOOM = 12;

// Cadrage dynamique sur les marqueurs plutôt qu'un center/zoom fixes sur
// <MapContainer> (ignorés après le montage initial en react-leaflet) : ce
// composant enfant a accès à l'instance Leaflet via useMap() et peut
// recadrer à chaque changement de filtre.
//
// filterChangeCount === 0 : vue initiale, volontairement laissée sur
// DEFAULT_CENTER/ZOOM (France, demande explicite) plutôt que de sauter sur
// les bornes de tous les marqueurs — faussées par le point de test isolé à
// (0,0), qui dézoomait jusqu'à une vue du monde entier dès l'ouverture de
// la page. Piloté par un compteur plutôt qu'un ref "premier passage" : en
// mode strict de React (dev), les effets sont invoqués deux fois au
// montage sur la même instance de ref, ce qui neutralisait un simple flag
// "déjà exécuté" — le compteur, lui, ne change que sur un vrai clic de
// filtre (voir toggleKind), jamais tout seul.
function FitBounds({
  markers,
  filterChangeCount,
}: {
  markers: MapMarker[];
  filterChangeCount: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (filterChangeCount === 0) {
      return;
    }
    if (markers.length === 0) {
      return;
    }
    if (markers.length === 1) {
      const [marker] = markers;
      map.setView([marker.latitude, marker.longitude], SINGLE_MARKER_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [markers, filterChangeCount, map]);

  return null;
}

// Recentre et rapproche (sans jamais dézoomer) sur le marqueur sélectionné,
// que la sélection vienne d'un clic direct sur la carte ou d'un lien vers
// un point sibling dans le volet (voir selectMarkerById) : les deux ne font
// que changer selectedMarker, ce composant réagit au même endroit pour les
// deux cas plutôt que dupliquer l'appel flyTo. Math.max(zoom actuel, cible)
// évite de dézoomer une vue déjà plus rapprochée que SELECTION_ZOOM.
function CenterOnSelection({ marker }: { marker: MapMarker | null }) {
  const map = useMap();

  useEffect(() => {
    if (!marker) {
      return;
    }
    const targetZoom = Math.max(map.getZoom(), SELECTION_ZOOM);
    map.flyTo([marker.latitude, marker.longitude], targetZoom, { animate: true, duration: 0.8 });
  }, [marker, map]);

  return null;
}

type AdminMapProps = {
  markers: MapMarker[];
};

export function AdminMap({ markers }: AdminMapProps) {
  const [activeKinds, setActiveKinds] = useState<Set<MapMarkerKind>>(new Set(ALL_KINDS));
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  // Ne sert qu'à déclencher FitBounds sur un vrai changement de filtre
  // (voir son commentaire) : la valeur elle-même n'a pas de sens, seul le
  // fait qu'elle passe de 0 à autre chose compte.
  const [filterChangeCount, setFilterChangeCount] = useState(0);

  const visibleMarkers = useMemo(
    () => markers.filter((marker) => activeKinds.has(marker.kind)),
    [markers, activeKinds],
  );

  function toggleKind(kind: MapMarkerKind) {
    setActiveKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
    setFilterChangeCount((count) => count + 1);
  }

  // Cherche dans `markers` (pas `visibleMarkers`) : un site sibling reste
  // sélectionnable depuis le volet même si son type est actuellement
  // masqué par le filtre — seul son marqueur sur la carte disparaît, pas
  // sa fiche.
  function selectMarkerById(id: string) {
    const marker = markers.find((candidate) => candidate.id === id);
    if (marker) {
      setSelectedMarker(marker);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* La légende sert aussi de filtre multi-sélection : chaque puce
      s'active/se désactive indépendamment (aucune combinaison exclusive),
      pas de contrôle de filtre séparé. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrer :</span>
        {ALL_KINDS.map((kind) => {
          const active = activeKinds.has(kind);
          return (
            <button
              key={kind}
              type="button"
              onClick={() => toggleKind(kind)}
              aria-pressed={active}
              className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm transition-colors data-[active=false]:text-muted-foreground/50 data-[active=true]:bg-muted data-[active=true]:text-foreground"
              data-active={active}
            >
              <span
                className="size-2.5 rounded-full border border-white shadow-sm"
                style={{ background: MARKER_COLORS[kind] }}
                aria-hidden
              />
              {MARKER_LABELS[kind]}
            </button>
          );
        })}
      </div>

      {/* isolate : Leaflet donne à ses propres contrôles/panneaux internes
      des z-index élevés (jusqu'à 1000, voir leaflet.css) qui, sans ça,
      passaient au-dessus du volet de détails (z-50, voir sheet.tsx) — un
      contexte d'empilement dédié cantonne ces z-index à l'intérieur de la
      carte, où qu'ils montent. */}
      <div className="isolate overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          className="h-[32rem] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds markers={visibleMarkers} filterChangeCount={filterChangeCount} />
          <CenterOnSelection marker={selectedMarker} />
          {visibleMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={createMarkerIcon(marker.kind)}
              eventHandlers={{ click: () => setSelectedMarker(marker) }}
            />
          ))}
        </MapContainer>
      </div>

      <Sheet
        open={selectedMarker !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMarker(null);
        }}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{selectedMarker?.label}</SheetTitle>
            <SheetDescription>
              {selectedMarker ? MARKER_LABELS[selectedMarker.kind] : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            {selectedMarker && selectedMarker.details.length > 0 && (
              <dl className="flex flex-col gap-1.5 text-sm">
                {selectedMarker.details.map((detail) => (
                  <div key={detail.label} className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{detail.label}</dt>
                    <dd className="font-medium text-foreground">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {selectedMarker && selectedMarker.siblingSites.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-border pt-4">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  Autres sites du même spot
                </span>
                {selectedMarker.siblingSites.map((sibling) => {
                  const SiblingIcon = MARKER_ICON_COMPONENTS[sibling.kind];
                  return (
                    <button
                      key={sibling.id}
                      type="button"
                      onClick={() => selectMarkerById(sibling.id)}
                      className="flex items-center gap-1.5 text-left text-sm text-primary hover:underline"
                    >
                      <SiblingIcon className="size-3.5 flex-none" aria-hidden />
                      {sibling.label}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedMarker && selectedMarker.relatedLinks.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-border pt-4">
                {selectedMarker.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <SheetFooter>
            <Button
              nativeButton={false}
              render={<Link href={selectedMarker?.editHref ?? "#"}>Modifier</Link>}
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

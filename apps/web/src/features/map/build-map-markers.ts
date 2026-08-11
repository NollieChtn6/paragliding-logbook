export type MapMarkerKind = "TAKEOFF" | "LANDING" | "SCHOOL";

export type MapMarkerDetail = { label: string; value: string };
export type MapMarkerLink = { label: string; href: string };
export type MapMarkerSibling = { id: string; label: string; kind: MapMarkerKind };

export type MapMarker = {
  id: string;
  kind: MapMarkerKind;
  label: string;
  latitude: number;
  longitude: number;
  editHref: string;
  details: MapMarkerDetail[];
  relatedLinks: MapMarkerLink[];
  // Autres sites du même spot (voir admin-map.tsx) : sélectionner un
  // site sibling doit rouvrir le volet sur ce marqueur et recentrer la
  // carte dessus, pas naviguer vers une autre page — d'où une liste de
  // marqueurs sélectionnables plutôt qu'un simple lien href.
  siblingSites: MapMarkerSibling[];
};

type SiteInput = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  altitudeM: number;
  orientationDeg: number | null;
  spotId: string;
  spot: { name: string };
  siteType: { code: string };
};

type SchoolInput = {
  id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

function siteKind(site: { siteType: { code: string } }): MapMarkerKind {
  return site.siteType.code === "TAKEOFF" ? "TAKEOFF" : "LANDING";
}

// Pas de marqueur "Spot" séparé : Spot.latitude/longitude ne sont pas
// renseignés en pratique (voir prisma/seed.ts, SpotSeed n'a pas ce champ) —
// seuls les Site ont des coordonnées fiables (champ obligatoire en base).
// L'école n'apparaît que si latitude/longitude sont renseignées (issues
// d'une sélection BAN, voir features/schools/address-combobox.tsx) : une
// école créée avant cette fonctionnalité n'a pas de coordonnées.
//
// relatedLinks reste volontairement limité au référentiel admin (spot ↔ ses
// sites) : pas de lien vers les stages effectués dans une école, qui
// appartiennent à un utilisateur précis (TrainingCamp.userId via Activity)
// — le compte ADMIN n'est propriétaire d'aucun stage, et /activities/[id]
// refuse déjà l'accès à qui n'en est pas propriétaire (décision explicite,
// pas juste un oubli).
export function buildMapMarkers(sites: SiteInput[], schools: SchoolInput[]): MapMarker[] {
  const siteMarkers: MapMarker[] = sites.map((site) => ({
    id: `site-${site.id}`,
    kind: siteKind(site),
    label: site.label,
    latitude: site.latitude,
    longitude: site.longitude,
    editHref: `/admin/sites/${site.id}/edit`,
    details: [
      { label: "Spot", value: site.spot.name },
      { label: "Altitude", value: `${site.altitudeM} m` },
      {
        label: "Orientation",
        value: site.orientationDeg !== null ? `${site.orientationDeg}°` : "—",
      },
    ],
    relatedLinks: [{ label: "Modifier le spot", href: `/admin/spots/${site.spotId}/edit` }],
    siblingSites: sites
      .filter((other) => other.spotId === site.spotId && other.id !== site.id)
      .map((other) => ({
        id: `site-${other.id}`,
        label: other.label,
        kind: siteKind(other),
      })),
  }));

  const schoolMarkers: MapMarker[] = schools
    .filter(
      (school): school is SchoolInput & { latitude: number; longitude: number } =>
        school.latitude !== null && school.longitude !== null,
    )
    .map((school) => ({
      id: `school-${school.id}`,
      kind: "SCHOOL",
      label: school.name,
      latitude: school.latitude,
      longitude: school.longitude,
      editHref: `/admin/schools/${school.id}/edit`,
      details: school.city ? [{ label: "Ville", value: school.city }] : [],
      relatedLinks: [],
      siblingSites: [],
    }));

  return [...siteMarkers, ...schoolMarkers];
}
